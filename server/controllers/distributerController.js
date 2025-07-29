
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
    const distributorAddress = req.query.address || req.headers['x-distributor-address'];
    let batches;
    if (distributorAddress) {
      batches = await Batch.find({ shipmentHistory: { $elemMatch: { to: distributorAddress } } });
    } else {
      batches = await Batch.find();
    }
    // Map to frontend format
    const formatted = await Promise.all(batches.map(async b => {
      // Try to get product name and serial number for this batch
      const product = await Product.findOne({ batchId: b._id });
      // Include full shipment history for UI
      return {
        batchId: b.batchNumber,
        product: product ? product.productName : (b.dosageForm + ' ' + b.strength),
        quantity: b.quantityProduced,
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
    const distributorAddress = req.query.address || req.headers['x-distributor-address'];
    
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
      
      // Calculate current quantity
      const initialQuantity = batch.quantityProduced || 0;
      const shippedQuantity = (batch.shipmentHistory || [])
        .filter(sh => sh.status?.toLowerCase() === 'delivered')
        .reduce((sum, sh) => sum + (Number(sh.quantity) || 0), 0);
      
      const currentQty = initialQuantity - shippedQuantity;

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
        total: initialQuantity,
        status: batch.status || 'Available',
        serialNumber: product?.serialNumber || '',
        manufacturingDate: product?.manufacturingDate || batch.manufacturingDate || new Date(batch.createdAt || Date.now()),
        expiryDate: product?.expiryDate || batch.expiryDate || null,
        storageConditions,
        lastUpdated: batch.updatedAt || batch.createdAt || new Date(),
        reserved: batch.reservedQuantity || 0
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
};