
const Distributor = require('../models/Distributor');
const Product = require('../models/Product');
const Batch = require('../models/Batch');
const User = require('../models/User');

// Fetch products assigned to distributor (filter by distributor address if provided)
const getDistributorProducts = async (req, res) => {
  try {
    // For demo: get distributor address from query or header (in real app, use auth)
    const distributorAddress = req.query.address || req.headers['x-distributor-address'];
    let products;
    if (distributorAddress) {
      // Find batches assigned to this distributor
      const batches = await Batch.find({ shipmentHistory: { $elemMatch: { to: distributorAddress } } });
      const batchIds = batches.map(b => b._id);
      products = await Product.find({ batchId: { $in: batchIds } }).select('serialNumber productName manufacturerId status batchId batchNumber');
    } else {
      products = await Product.find().select('serialNumber productName manufacturerId status batchId batchNumber');
    }
    res.json({ products });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch products', error: error.message });
  }
};

// Fetch assigned batches (filter by distributor address if provided)
const getDistributorBatches = async (req, res) => {
  try {
    let distributorAddress = req.query.address || req.headers['x-distributor-address'];
    // Derive from authenticated user if missing and role is distributor
    if (!distributorAddress && req.user && req.user.role === 'distributor') {
      const authUser = await User.findById(req.user.userId).lean();
      distributorAddress = authUser?.address;
    }
    let batches;
    if (distributorAddress) {
      batches = await Batch.find({ shipmentHistory: { $elemMatch: { to: distributorAddress } } });
    } else {
      batches = await Batch.find();
    }
    // Map to frontend format
    const formatted = await Promise.all(batches.map(async b => {
      const product = await Product.findOne({ batchId: b._id });

      // Sum quantities assigned TO this distributor (manufacturer -> distributor)
      const assignedToDistributor = (b.shipmentHistory || []).reduce((sum, entry) => {
        const qty = Number(entry.quantity) || 0;
        if (entry.to === distributorAddress || entry.toAddress === distributorAddress) {
          // Count only manufacturer -> distributor movements (Produced status excluded)
          if (entry.status && entry.status.toLowerCase() !== 'produced') {
            return sum + qty;
          }
        }
        return sum;
      }, 0);

      // Sum quantities the distributor has already shipped OUT to pharmacies (toAddress not equal distributor)
      const shippedOutByDistributor = (b.shipmentHistory || []).reduce((sum, entry) => {
        const qty = Number(entry.quantity) || 0;
        if ((entry.from === distributorAddress || entry.fromAddress === distributorAddress) && entry.to !== distributorAddress) {
          if (entry.status && ['in transit','delivered'].includes(entry.status.toLowerCase())) {
            return sum + qty;
          }
        }
        return sum;
      }, 0);

      const distributorAvailable = Math.max(0, assignedToDistributor - shippedOutByDistributor);

      return {
        batchId: b.batchNumber,
        storageConditions: b.storageConditions,
        manufactureDate: b.manufactureDate,
        expiryDate: b.expiryDate,
        dosageForm: b.dosageForm,
        strength: b.strength,
        productionLocation: b.productionLocation,
        approvalCertId: b.approvalCertId,
        product: product ? product.productName : (b.dosageForm + ' ' + b.strength),
        // quantity now reflects what this distributor still holds
        quantity: distributorAvailable,
        totalAssignedToDistributor: assignedToDistributor,
        shippedOutByDistributor,
        status: b.shipmentStatus,
        manufacturer: b.manufacturerId ? b.manufacturerId.toString() : '',
        serialNumber: product ? product.serialNumber : '',
        shipmentHistory: b.shipmentHistory || []
      };
    }));
    res.json({ batches: formatted });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch batches', error: error.message });
  }
};

// Fetch inventory (batches with quantityAvailable > 0, filter by distributor if provided)
const getDistributorInventory = async (req, res) => {
  try {
    let distributorAddress = req.query.address || req.headers['x-distributor-address'];
    if (!distributorAddress && req.user && req.user.role === 'distributor') {
      const authUser = await User.findById(req.user.userId).lean();
      distributorAddress = authUser?.address;
    }
    
    // Find batches for this distributor
    let query = {};
    if (distributorAddress) {
      query.shipmentHistory = { $elemMatch: { to: distributorAddress } };
    }
    
    const batches = await Batch.find(query)
      .populate('manufacturerId', 'name')
      .lean();

    // Process each batch to get current inventory status
    const inventory = await Promise.all(batches.map(async batch => {
      const product = await Product.findOne({ batchId: batch._id }).lean();
      
      // Quantities from perspective of this distributor
      const assignedToDistributor = (batch.shipmentHistory || []).reduce((sum, entry) => {
        const qty = Number(entry.quantity) || 0;
        if (entry.to === distributorAddress || entry.toAddress === distributorAddress) {
          if (entry.status && entry.status.toLowerCase() !== 'produced') {
            return sum + qty;
          }
        }
        return sum;
      }, 0);

      const shippedOutByDistributor = (batch.shipmentHistory || []).reduce((sum, entry) => {
        const qty = Number(entry.quantity) || 0;
        if ((entry.from === distributorAddress || entry.fromAddress === distributorAddress) && entry.to !== distributorAddress) {
          if (entry.status && ['in transit','delivered'].includes(entry.status.toLowerCase())) {
            return sum + qty;
          }
        }
        return sum;
      }, 0);

      const reservedByDistributor = (batch.shipmentHistory || []).reduce((sum, entry) => {
        const qty = Number(entry.quantity) || 0;
        if ((entry.from === distributorAddress || entry.fromAddress === distributorAddress) && entry.to !== distributorAddress) {
          if (entry.status && ['pending','rejected'].includes(entry.status.toLowerCase())) {
            return sum + qty;
          }
        }
        return sum;
      }, 0);

      const currentQty = Math.max(0, assignedToDistributor - shippedOutByDistributor);

      // Parse storage conditions string or use object
      let storageConditions;
      if (typeof batch.storageConditions === 'string') {
        const tempMatch = batch.storageConditions.match(/below (\d+)°C/);
        storageConditions = {
          temperature: tempMatch ? `${tempMatch[1]}°C` : 'Room temperature',
          humidity: 'Normal',
          lightExposure: 'Store in a dark place'
        };
      } else if (typeof batch.storageConditions === 'object' && batch.storageConditions !== null) {
        storageConditions = batch.storageConditions;
      } else {
        storageConditions = {
          temperature: 'Room temperature',
          humidity: 'Normal',
          lightExposure: 'Store in a dark place'
        };
      }
      
      return {
        batchId: batch.batchNumber,
        product: product?.productName || `${batch.dosageForm || ''} ${batch.strength || ''}`.trim(),
        manufacturer: batch.manufacturerId?.name || 'N/A',
  quantity: currentQty,
  totalAssignedToDistributor: assignedToDistributor,
        status: batch.status || 'Available',
        serialNumber: product?.serialNumber || '',
        manufacturingDate: product?.manufacturingDate || batch.manufacturingDate || new Date(batch.createdAt || Date.now()),
        expiryDate: product?.expiryDate || batch.expiryDate || null,
        storageConditions,
        lastUpdated: batch.updatedAt || batch.createdAt || new Date(),
  reserved: reservedByDistributor || 0,
  shippedOutByDistributor
      };
    }));

    // Filter out items with zero or negative quantity
    const validInventory = inventory.filter(item => item.quantity > 0);

    res.json({ inventory: validInventory });
  } catch (error) {
    console.error('Error in getDistributorInventory:', error);
    res.status(500).json({ 
      message: 'Failed to fetch inventory', 
      error: error.message 
    });
  }
};

// Fetch transfer/distribution history (from shipmentHistory) with product name and correct quantities
const getDistributorTransfers = async (req, res) => {
  try {
    const distributorAddress = req.query.address || req.headers['x-distributor-address'];
    let batches;
    if (distributorAddress) {
      batches = await Batch.find({ shipmentHistory: { $elemMatch: { to: distributorAddress } } });
    } else {
      batches = await Batch.find();
    }
    // Flatten all shipmentHistory entries for this distributor
    const transfers = [];
    for (const batch of batches) {
      // Try to get product name for this batch
      const productDoc = await Product.findOne({ batchId: batch._id });
      const productName = productDoc ? productDoc.productName : (batch.dosageForm + ' ' + batch.strength);
      // Calculate total and left for this batch
      let total = 0;
      let delivered = 0;
      for (const dist of batch.shipmentHistory) {
        const qty = Number(dist.quantity) || 0;
        total += qty;
        if (dist.status === 'Delivered') delivered += qty;
        if (!distributorAddress || dist.to === distributorAddress) {
          transfers.push({
            batchId: batch.batchNumber,
            product: productName,
            quantity: qty,
            status: dist.status,
            to: dist.to,
            from: dist.from,
            timestamp: dist.timestamp,
            total,
            left: total - delivered
          });
        }
      }
    }
    res.json({ transfers });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch transfers', error: error.message });
  }
};

// Receive product (update product status and batch shipmentStatus, and update shipmentHistory entry)
const receiveProduct = async (req, res) => {
  try {
    const { serialNumber } = req.body;
    if (!serialNumber) return res.status(400).json({ message: 'serialNumber is required' });
    const product = await Product.findOne({ serialNumber });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    // Mark as received (for demo, set status field)
    product.status = 'Received';
    await product.save();
    // Update batch status and shipmentHistory
    const batch = await Batch.findById(product.batchId);
    if (batch) {
      // Find the last shipmentHistory entry with status 'In Transit' to get its details
      let lastInTransit = null;
      for (let i = batch.shipmentHistory.length - 1; i >= 0; i--) {
        if (batch.shipmentHistory[i].status === 'In Transit') {
          lastInTransit = batch.shipmentHistory[i];
          break;
        }
      }
      // Always add a Delivered entry and update status, even if no In Transit found
      batch.shipmentHistory.push({
        timestamp: new Date(),
        from: lastInTransit ? (lastInTransit.to || 'distributor') : 'distributor',
        to: lastInTransit ? (lastInTransit.to || 'distributor') : 'distributor',
        status: 'Delivered',
        quantity: lastInTransit ? (lastInTransit.quantity || '1') : '1',
        remarks: 'Acknowledged by distributor'
      });
      batch.shipmentStatus = 'Delivered';
      await batch.save();
    }
    res.json({ message: 'Product received successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to receive product', error: error.message });
  }
};

// Ship product to pharmacy (update product/batch status and add to shipmentHistory)
const shipProduct = async (req, res) => {
  try {
    const { serialNumber, pharmacy } = req.body;
    if (!serialNumber || !pharmacy) return res.status(400).json({ message: 'serialNumber and pharmacy are required' });
    const product = await Product.findOne({ serialNumber });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    // Mark as shipped (for demo, set status field)
    product.status = 'Shipped';
    await product.save();
    // Update batch shipmentHistory
    await Batch.updateOne(
      { _id: product.batchId },
      { $push: { shipmentHistory: {
        timestamp: new Date(),
        from: 'distributor',
        to: pharmacy,
        status: 'In Transit',
        quantity: '1',
        remarks: 'Shipped to pharmacy'
      } }, $set: { shipmentStatus: 'In Transit' } }
    );
    res.json({ message: 'Product shipped successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to ship product', error: error.message });
  }
};


// Distribute batch quantity (aggregate) from distributor to pharmacy
// Body: { batchNumber, pharmacyAddress, quantity, remarks }
const distributeBatchToPharmacy = async (req, res) => {
  try {
    const { batchNumber, pharmacyAddress, quantity, remarks } = req.body;
    if (!batchNumber || !pharmacyAddress || !quantity) {
      return res.status(400).json({ message: 'batchNumber, pharmacyAddress and quantity are required' });
    }
    const qty = Number(quantity);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({ message: 'quantity must be a positive number' });
    }

    // Find batch
    const batch = await Batch.findOne({ batchNumber });
    if (!batch) return res.status(404).json({ message: 'Batch not found' });

    // Distributor address from auth user (assuming user has address field)
    const distributorUser = await User.findById(req.user.userId);
    if (!distributorUser) return res.status(404).json({ message: 'Distributor user not found' });
    const distributorAddress = distributorUser.address;

    // Compute distributor holdings
    const assignedToDistributor = (batch.shipmentHistory || []).reduce((sum, entry) => {
      const q = Number(entry.quantity) || 0;
      if (entry.toAddress === distributorAddress || entry.to === distributorAddress) {
        if (entry.status && entry.status.toLowerCase() !== 'produced') {
          return sum + q;
        }
      }
      return sum;
    }, 0);

    const shippedOutByDistributor = (batch.shipmentHistory || []).reduce((sum, entry) => {
      const q = Number(entry.quantity) || 0;
      if ((entry.fromAddress === distributorAddress || entry.from === distributorAddress) && entry.to !== distributorAddress) {
        if (entry.status && ['in transit','delivered'].includes(entry.status.toLowerCase())) {
          return sum + q;
        }
      }
      return sum;
    }, 0);

    const available = Math.max(0, assignedToDistributor - shippedOutByDistributor);
    if (available < qty) {
      return res.status(400).json({ message: `Insufficient distributor quantity. Available: ${available}` });
    }

    // Append shipmentHistory entry
    batch.shipmentHistory.push({
      timestamp: new Date(),
      from: distributorUser.companyName || 'Distributor',
      fromAddress: distributorAddress,
      to: pharmacyAddress,
      toAddress: pharmacyAddress,
      status: 'In Transit',
      quantity: qty.toString(),
      remarks: remarks || 'Distribution to pharmacy'
    });
    batch.shipmentStatus = 'In Transit';
    await batch.save();

    res.json({
      message: 'Distribution recorded',
      batchNumber,
      quantity: qty,
      remaining: available - qty
    });
  } catch (error) {
    console.error('Distribute batch error:', error);
    res.status(500).json({ message: 'Failed to distribute batch', error: error.message });
  }
};

const getApprovedDistributors = async (req, res) => {
  try {
    const distributors = await Distributor.find()
      .populate({
        path: 'user',
        match: { isApproved: true },
        select: 'name email phone address role country state city isApproved'
      });

    // Filter out null users (i.e., not approved)
    const approvedDistributors = distributors.filter(d => d.user !== null);

    res.json(approvedDistributors);
  } catch (error) {
    console.error("Error fetching distributors:", error);
    res.status(500).json({ message: 'Failed to fetch approved distributors', error: error.message });
  }
};

module.exports = {
  getApprovedDistributors,
  getDistributorProducts,
  getDistributorBatches,
  getDistributorInventory,
  getDistributorTransfers,
  receiveProduct,
  shipProduct
  ,distributeBatchToPharmacy
};