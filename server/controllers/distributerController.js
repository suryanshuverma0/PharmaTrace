
const Distributor = require('../models/Distributor');
const Product = require('../models/Product');
const Batch = require('../models/Batch');
const User = require('../models/User');

// Fetch products assigned to distributor (filter by distributor address if provided)
const getDistributorProducts = async (req, res) => {
  try {
    // Set no-cache headers to prevent 304 responses
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
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
    // Set no-cache headers to prevent 304 responses
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
    let distributorAddress = req.query.address || req.headers['x-distributor-address'];
    let distributorCompanyName = null;
    
    // Get distributor info from authenticated user
    if (req.user && req.user.role === 'distributor') {
      const authUser = await User.findById(req.user.userId).lean();
      if (!distributorAddress) distributorAddress = authUser?.address;
      
      // Get distributor's company name for matching
      const distributorProfile = await Distributor.findOne({ user: req.user.userId }).lean();
      distributorCompanyName = distributorProfile?.companyName;
    }
    
    let batches;
    if (distributorAddress || distributorCompanyName) {
      // Find batches assigned to this distributor by address OR company name
      batches = await Batch.find({ 
        $or: [
          { shipmentHistory: { $elemMatch: { to: distributorAddress } } },
          { shipmentHistory: { $elemMatch: { toAddress: distributorAddress } } },
          { shipmentHistory: { $elemMatch: { to: distributorCompanyName } } }
        ]
      });
    } else {
      batches = await Batch.find();
    }
    
    // Map to frontend format
    const formatted = await Promise.all(batches.map(async b => {
      const product = await Product.findOne({ batchId: b._id });

      // Sum quantities assigned TO this distributor (manufacturer -> distributor)
      const assignedToDistributor = (b.shipmentHistory || []).reduce((sum, entry) => {
        const qty = Number(entry.quantity) || 0;
        const isToDistributor = entry.to === distributorAddress || 
                               entry.toAddress === distributorAddress || 
                               entry.to === distributorCompanyName;
        
        // Only count entries where manufacturer assigns to distributor (exclude Produced and Delivered acknowledgments)
        const isFromManufacturer = entry.from !== distributorAddress && 
                                  entry.from !== distributorCompanyName &&
                                  entry.fromAddress !== distributorAddress;
        
        if (isToDistributor && isFromManufacturer && 
            entry.status && !['produced', 'delivered'].includes(entry.status.toLowerCase())) {
          return sum + qty;
        }
        return sum;
      }, 0);

      // Sum quantities the distributor has already shipped OUT to pharmacies
      const shippedOutByDistributor = (b.shipmentHistory || []).reduce((sum, entry) => {
        const qty = Number(entry.quantity) || 0;
        const isFromDistributor = entry.from === distributorAddress || 
                                 entry.fromAddress === distributorAddress || 
                                 entry.from === distributorCompanyName;
        const isNotToDistributor = entry.to !== distributorAddress && 
                                  entry.to !== distributorCompanyName && 
                                  entry.toAddress !== distributorAddress;
        
        if (isFromDistributor && isNotToDistributor && 
            entry.status && ['in transit','delivered'].includes(entry.status.toLowerCase())) {
          return sum + qty;
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
    // Set no-cache headers to prevent 304 responses
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
    let distributorAddress = req.query.address || req.headers['x-distributor-address'];
    let distributorCompanyName = null;
    
    // Get distributor info from authenticated user
    if (req.user && req.user.role === 'distributor') {
      const authUser = await User.findById(req.user.userId).lean();
      if (!distributorAddress) distributorAddress = authUser?.address;
      
      // Get distributor's company name for matching
      const distributorProfile = await Distributor.findOne({ user: req.user.userId }).lean();
      distributorCompanyName = distributorProfile?.companyName;
    }
    
    // Find batches for this distributor
    let query = {};
    if (distributorAddress || distributorCompanyName) {
      query = { 
        $or: [
          { shipmentHistory: { $elemMatch: { to: distributorAddress } } },
          { shipmentHistory: { $elemMatch: { toAddress: distributorAddress } } },
          { shipmentHistory: { $elemMatch: { to: distributorCompanyName } } }
        ]
      };
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
        const isToDistributor = entry.to === distributorAddress || 
                               entry.toAddress === distributorAddress || 
                               entry.to === distributorCompanyName;
        
        // Only count entries where manufacturer assigns to distributor (exclude Produced and Delivered acknowledgments)
        const isFromManufacturer = entry.from !== distributorAddress && 
                                  entry.from !== distributorCompanyName &&
                                  entry.fromAddress !== distributorAddress;
        
        if (isToDistributor && isFromManufacturer && 
            entry.status && !['produced', 'delivered'].includes(entry.status.toLowerCase())) {
          return sum + qty;
        }
        return sum;
      }, 0);

      const shippedOutByDistributor = (batch.shipmentHistory || []).reduce((sum, entry) => {
        const qty = Number(entry.quantity) || 0;
        const isFromDistributor = entry.from === distributorAddress || 
                                 entry.fromAddress === distributorAddress || 
                                 entry.from === distributorCompanyName;
        const isNotToDistributor = entry.to !== distributorAddress && 
                                  entry.to !== distributorCompanyName && 
                                  entry.toAddress !== distributorAddress;
        
        if (isFromDistributor && isNotToDistributor && 
            entry.status && ['in transit','delivered'].includes(entry.status.toLowerCase())) {
          return sum + qty;
        }
        return sum;
      }, 0);

      const reservedByDistributor = (batch.shipmentHistory || []).reduce((sum, entry) => {
        const qty = Number(entry.quantity) || 0;
        const isFromDistributor = entry.from === distributorAddress || 
                                 entry.fromAddress === distributorAddress || 
                                 entry.from === distributorCompanyName;
        const isNotToDistributor = entry.to !== distributorAddress && 
                                  entry.to !== distributorCompanyName && 
                                  entry.toAddress !== distributorAddress;
        
        if (isFromDistributor && isNotToDistributor && 
            entry.status && ['pending','rejected'].includes(entry.status.toLowerCase())) {
          return sum + qty;
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

    // Filter out items that were never assigned to this distributor
    const validInventory = inventory.filter(item => item.totalAssignedToDistributor > 0);

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
    // Set no-cache headers to prevent 304 responses
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
    let distributorAddress = req.query.address || req.headers['x-distributor-address'];
    let distributorCompanyName = null;
    
    // Get distributor info from authenticated user
    if (req.user && req.user.role === 'distributor') {
      const authUser = await User.findById(req.user.userId).lean();
      if (!distributorAddress) distributorAddress = authUser?.address;
      
      // Get distributor's company name for matching
      const distributorProfile = await Distributor.findOne({ user: req.user.userId }).lean();
      distributorCompanyName = distributorProfile?.companyName;
    }
    
    let batches;
    if (distributorAddress || distributorCompanyName) {
      // Find batches assigned to this distributor
      batches = await Batch.find({ 
        $or: [
          { shipmentHistory: { $elemMatch: { to: distributorAddress } } },
          { shipmentHistory: { $elemMatch: { toAddress: distributorAddress } } },
          { shipmentHistory: { $elemMatch: { to: distributorCompanyName } } }
        ]
      });
    } else {
      batches = await Batch.find();
    }
    
    // Get only transfers FROM this distributor to pharmacies (outgoing transfers)
    const transfers = [];
    for (const batch of batches) {
      // Try to get product name for this batch
      const productDoc = await Product.findOne({ batchId: batch._id });
      const productName = productDoc ? productDoc.productName : (batch.dosageForm + ' ' + batch.strength);
      
      // Only include transfers where this distributor is the sender
      for (const shipment of batch.shipmentHistory) {
        const isFromDistributor = shipment.from === distributorAddress || 
                                 shipment.fromAddress === distributorAddress || 
                                 shipment.from === distributorCompanyName;
        const isNotToDistributor = shipment.to !== distributorAddress && 
                                  shipment.to !== distributorCompanyName && 
                                  shipment.toAddress !== distributorAddress;
        
        // Only include outgoing transfers from distributor to others (excluding Produced status)
        if (isFromDistributor && isNotToDistributor && 
            shipment.status && shipment.status.toLowerCase() !== 'produced') {
          
          const qty = Number(shipment.quantity) || 0;
          transfers.push({
            batchId: batch.batchNumber,
            product: productName,
            quantity: qty,
            status: shipment.status,
            to: shipment.to || shipment.toAddress,
            from: shipment.from || shipment.fromAddress,
            timestamp: shipment.timestamp,
            remarks: shipment.remarks,
            transactionHash: shipment.transactionHash,
            environmentalConditions: shipment.environmentalConditions,
            qualityCheck: shipment.qualityCheck
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
    
    // Get distributor information for actor field
    let distributorName = 'Unknown Distributor';
    let distributorLocation = '';
    
    if (req.user && req.user.role === 'distributor') {
      const distributorProfile = await Distributor.findOne({ user: req.user.userId }).lean();
      if (distributorProfile) {
        distributorName = distributorProfile.companyName;
        distributorLocation = distributorProfile.warehouseAddress;
      }
    }
    
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
      const newShipmentEntry = {
        timestamp: new Date(),
        from: lastInTransit ? (lastInTransit.to || distributorName) : 'Manufacturer',
        to: distributorName,
        fromAddress: lastInTransit ? lastInTransit.toAddress : null,
        toAddress: req.user ? req.user.address : null,
        status: 'Delivered',
        quantity: lastInTransit ? (lastInTransit.quantity || '1') : '1',
        remarks: 'Acknowledged by distributor',
        actor: {
          name: distributorName,
          type: 'Distributor',
          location: distributorLocation
        },
        environmentalConditions: {
          temperature: '25°C',
          humidity: '60%',
          status: 'Normal'
        },
        qualityCheck: {
          performedBy: distributorName,
          date: new Date(),
          result: 'Pass',
          notes: 'Received in good condition'
        }
      };
      
      batch.shipmentHistory.push(newShipmentEntry);
      batch.shipmentStatus = 'Delivered';
      await batch.save();
    }
    
    res.json({ message: 'Product received successfully' });
  } catch (error) {
    console.error('Error in receiveProduct:', error);
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
    
    // Get distributor information for actor field
    let distributorName = 'Unknown Distributor';
    let distributorLocation = '';
    
    if (req.user && req.user.role === 'distributor') {
      const distributorProfile = await Distributor.findOne({ user: req.user.userId }).lean();
      if (distributorProfile) {
        distributorName = distributorProfile.companyName;
        distributorLocation = distributorProfile.warehouseAddress;
      }
    }
    
    // Mark as shipped (for demo, set status field)
    product.status = 'Shipped';
    await product.save();
    
    // Update batch shipmentHistory with proper actor field
    const newShipmentEntry = {
      timestamp: new Date(),
      from: distributorName,
      to: pharmacy,
      fromAddress: req.user ? req.user.address : null,
      toAddress: null, // Pharmacy address would be set when known
      status: 'In Transit',
      quantity: '1',
      remarks: 'Shipped to pharmacy',
      actor: {
        name: distributorName,
        type: 'Distributor',
        location: distributorLocation
      },
      environmentalConditions: {
        temperature: '25°C',
        humidity: '60%',
        status: 'Normal'
      },
      qualityCheck: {
        performedBy: distributorName,
        date: new Date(),
        result: 'Pass',
        notes: 'Pre-shipment quality check passed'
      }
    };
    
    await Batch.updateOne(
      { _id: product.batchId },
      { 
        $push: { shipmentHistory: newShipmentEntry }, 
        $set: { shipmentStatus: 'In Transit' } 
      }
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

    // Get distributor profile for company name
    const distributorProfile = await Distributor.findOne({ user: req.user.userId }).lean();
    const distributorName = distributorProfile ? distributorProfile.companyName : 'Unknown Distributor';
    const distributorLocation = distributorProfile ? distributorProfile.warehouseAddress : '';

    // Compute distributor holdings
    const assignedToDistributor = (batch.shipmentHistory || []).reduce((sum, entry) => {
      const q = Number(entry.quantity) || 0;
      const isToDistributor = entry.toAddress === distributorAddress || 
                             entry.to === distributorAddress ||
                             entry.to === distributorName;
      
      // Only count entries where manufacturer assigns to distributor (exclude Produced and Delivered acknowledgments)
      const isFromManufacturer = entry.from !== distributorAddress && 
                                entry.from !== distributorName &&
                                entry.fromAddress !== distributorAddress;
      
      if (isToDistributor && isFromManufacturer && 
          entry.status && !['produced', 'delivered'].includes(entry.status.toLowerCase())) {
        return sum + q;
      }
      return sum;
    }, 0);

    const shippedOutByDistributor = (batch.shipmentHistory || []).reduce((sum, entry) => {
      const q = Number(entry.quantity) || 0;
      const isFromDistributor = entry.fromAddress === distributorAddress || 
                               entry.from === distributorAddress ||
                               entry.from === distributorName;
      const isNotToDistributor = entry.to !== distributorAddress && 
                                entry.to !== distributorName && 
                                entry.toAddress !== distributorAddress;
      
      if (isFromDistributor && isNotToDistributor && 
          entry.status && ['in transit','delivered'].includes(entry.status.toLowerCase())) {
        return sum + q;
      }
      return sum;
    }, 0);

    const available = Math.max(0, assignedToDistributor - shippedOutByDistributor);
    if (available < qty) {
      return res.status(400).json({ message: `Insufficient distributor quantity. Available: ${available}` });
    }

    // Append shipmentHistory entry with required actor field
    const newShipmentEntry = {
      timestamp: new Date(),
      from: distributorName,
      fromAddress: distributorAddress,
      to: pharmacyAddress,
      toAddress: pharmacyAddress,
      status: 'In Transit',
      quantity: qty.toString(),
      remarks: remarks || 'Distribution to pharmacy',
      actor: {
        name: distributorName,
        type: 'Distributor',
        location: distributorLocation
      },
      environmentalConditions: {
        temperature: '25°C',
        humidity: '60%',
        status: 'Normal'
      },
      qualityCheck: {
        performedBy: distributorName,
        date: new Date(),
        result: 'Pass',
        notes: 'Pre-distribution quality check passed'
      }
    };
    
    batch.shipmentHistory.push(newShipmentEntry);
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