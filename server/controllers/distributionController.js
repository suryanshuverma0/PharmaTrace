const { default: mongoose } = require('mongoose');
const Batch = require('../models/Batch');
const Distribution = require('../models/Distribution');
const Product = require('../models/Product');
const Pharmacist = require('../models/Pharmacist');
const Distributor = require('../models/Distributor');

// Get available batches for distribution
exports.getAvailableBatches = async (req, res) => {
  try {
    // Get distributor ID from authenticated user
    const distributorId = req.user.userId;

    console.log("Distributor wallet address:", req.user.walletAddress);

    // First find all batches that have been assigned to this distributor
    console.log('Looking for batches assigned to wallet:', req.user.walletAddress);
    
    const batches = await Batch.find({
      'shipmentHistory': {
        $elemMatch: {
          $or: [
            { to: req.user.walletAddress },  // Match on wallet address in 'to' field
            { to: "PharmaCorp.Pvt.Ltd" }     // Match on company name in 'to' field
          ],
          status: { $in: ['In Transit', 'Manufactured', 'Assigned'] }  // Include all relevant statuses
        }
      },
      quantityAvailable: { $gt: 0 }  // Only get batches with available quantity
    }).lean();  // Use lean for better performance
    
    console.log('Found batches before processing:', JSON.stringify(batches, null, 2));

    console.log('Query wallet address:', req.user.walletAddress);
    console.log('Found batches count:', batches.length);

    console.log("Found batches:", JSON.stringify(batches, null, 2));

    // Map to frontend format - exactly like distributerController
    const processedBatches = await Promise.all(batches.map(async batch => {
      // Try to get product name and serial number for this batch using batchNumber
      // Fetch related product by batch number
      const product = await Product.findOne({ batchNumber: batch.batchNumber }).lean();

      // Calculate distributed quantity for this distributor
      const distributedQuantity = batch.shipmentHistory
        .filter(hist => hist.from === req.user.walletAddress || hist.from === "PharmaCorp.Pvt.Ltd")
        .reduce((total, hist) => total + (Number(hist.quantity) || 0), 0);

      // Calculate received quantity for this distributor
      const receivedQuantity = batch.shipmentHistory
        .filter(hist => hist.to === req.user.walletAddress || hist.to === "PharmaCorp.Pvt.Ltd")
        .reduce((total, hist) => total + (Number(hist.quantity) || 0), 0);

      // Calculate available quantity for this distributor
      const availableQuantity = receivedQuantity - distributedQuantity;
      
      console.log(`Batch ${batch.batchNumber} quantities:`, {
        received: receivedQuantity,
        distributed: distributedQuantity,
        available: availableQuantity
      });

      // Find latest relevant shipment entry
      const latestShipment = batch.shipmentHistory
        .filter(hist => 
          hist.to === req.user.walletAddress || 
          hist.to === "PharmaCorp.Pvt.Ltd" ||
          (hist.status === 'In Transit' && (hist.to === req.user.walletAddress || hist.to === "PharmaCorp.Pvt.Ltd"))
        )
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];

      // Include full shipment history and quantity info for UI
      return {
        batchId: batch._id,
        batchNumber: batch.batchNumber,
        product: product ? product.productName : (batch.dosageForm + ' ' + batch.strength),
        quantity: availableQuantity, // Available quantity for distribution
        manufacturingDate: batch.manufactureDate,
        expiryDate: batch.expiryDate,
        status: batch.shipmentStatus || (latestShipment ? latestShipment.status : 'Unknown'),
        manufacturer: batch.manufacturerId ? batch.manufacturerId.toString() : '',
        serialNumber: product ? product.serialNumber : '',
        shipmentHistory: batch.shipmentHistory || [],
        // Additional useful information
        totalQuantity: batch.quantityProduced,
        availableQuantity: availableQuantity,
        receivedQuantity: receivedQuantity,
        distributedQuantity: distributedQuantity
      };
    }));

    // Sort by most recent first
    processedBatches.sort((a, b) => {
      const dateA = a.shipmentHistory[0]?.timestamp || new Date(0);
      const dateB = b.shipmentHistory[0]?.timestamp || new Date(0);
      return new Date(dateB) - new Date(dateA);
    });

    // Return in the exact same format as distributerController
    res.json({ batches: processedBatches });

  } catch (error) {
    console.error('Error getting available batches:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get available batches',
      error: error.message
    });
  }
};

// Get distribution history
exports.getDistributionHistory = async (req, res) => {
  try {
    // Get distributor ID from authenticated user
    const distributorId = req.user.userId;
    
    // Get pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build query
    const query = { distributorId };
    if (req.query.status) query.status = req.query.status;
    if (req.query.startDate) query.assignedAt = { $gte: new Date(req.query.startDate) };
    if (req.query.endDate) query.assignedAt = { ...query.assignedAt, $lte: new Date(req.query.endDate) };

    // Get total count for pagination
    const total = await Distribution.countDocuments(query);

    // Get distributions
    const distributions = await Distribution.find(query)
      .populate('pharmacyId', 'name location')
      .populate('batchId', 'batchNumber')
      .sort({ assignedAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      history: distributions.map(dist => ({
        id: dist._id,
        batchNumber: dist.batchId.batchNumber,
        pharmacy: {
          id: dist.pharmacyId._id,
          name: dist.pharmacyId.name,
          location: dist.pharmacyId.location
        },
        quantity: dist.quantity,
        assignedAt: dist.assignedAt,
        status: dist.status,
        lastUpdated: dist.lastUpdated
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });

  } catch (error) {
    console.error('Error getting distribution history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get distribution history',
      error: error.message
    });
  }
};

// Assign batch to pharmacy
exports.assignToPharmacy = async (req, res) => {
  try {
    const { 
      batchId, 
      batchNumber,
      pharmacistId, 
      quantity, 
      remarks,
      status = 'Distributed',
      storageRequirements,
      transportationMethod,
      expectedDeliveryDate
    } = req.body;
    const distributorId = req.user.userId;

    console.log('Received assignment request:', {
      batchNumber,
      pharmacistId,
      quantity
    });

    // Get pharmacy details with user information
    const pharmacy = await Pharmacist.findById(pharmacistId)
      .populate('user', 'name address')  // Using correct field 'address' from User model
      .lean();
      
    if (!pharmacy) {
      return res.status(404).json({
        success: false,
        message: 'Pharmacy not found'
      });
    }

    // Get distributor details
    const distributor = await Distributor.findOne({ user: req.user.userId })
      .populate('user', 'name address')
      .lean();

    if (!distributor) {
      return res.status(404).json({
        success: false,
        message: 'Distributor not found'
      });
    }

    console.log('Found entities:', {
      pharmacy,
      distributor,
      user: req.user
    });

    // Use the correct fields from the models
    const pharmacyName = pharmacy.pharmacyName;
    const pharmacyLocation = pharmacy.pharmacyLocation || 'N/A';
    const pharmacyWallet = pharmacy.user?.address;
    const distributorName = distributor.companyName;
    const distributorAddress = distributor.user?.address;

    // Validate batch exists and has enough quantity
    const batch = await Batch.findOne({ batchNumber: batchNumber });
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found with number: ' + batchNumber
      });
    }

    console.log('Calculating quantities for batch:', {
      batchNumber,
      shipmentHistory: batch.shipmentHistory,
      userWallet: req.user.walletAddress,
      distributorName: distributor.companyName,
      distributorAddress: distributor.user?.address
    });

    // Calculate current available quantity for this distributor
    const distributorShipments = batch.shipmentHistory.filter(hist => 
      (hist.to === distributorName || hist.toAddress === distributorAddress) && 
      (hist.status === 'In Transit' || hist.status === 'Assigned' || hist.status === 'Manufactured')
    );

    const receivedQuantity = distributorShipments.reduce(
      (total, hist) => total + Number(hist.quantity), 0
    );

    const distributedShipments = batch.shipmentHistory.filter(hist => 
      (hist.from === distributorName || hist.fromAddress === distributorAddress) && 
      (hist.status === 'Distributed' || hist.status === 'In Transit')
    );

    const distributedQuantity = distributedShipments.reduce(
      (total, hist) => total + Number(hist.quantity), 0
    );

    const availableQuantity = receivedQuantity - distributedQuantity;

    console.log('Quantity calculation:', {
      receivedQuantity,
      distributedQuantity,
      availableQuantity,
      distributorShipments,
      distributedShipments
    });

    if (availableQuantity < quantity) {
      return res.status(400).json({
        success: false,
        message: `Insufficient quantity. Only ${availableQuantity} units available`
      });
    }

    // Validate required pharmacy fields
    if (!pharmacyName) {
      console.error('Missing pharmacy name:', {
        pharmacy,
        pharmacistId
      });
      return res.status(400).json({
        success: false,
        message: 'Pharmacy name is missing. Please ensure the pharmacy registration is complete.'
      });
    }

    // Validate pharmacy wallet address for blockchain tracking
    if (!pharmacyWallet || pharmacyWallet === 'N/A') {
      console.error('Missing pharmacy wallet address:', {
        pharmacy,
        pharmacistId,
        user: pharmacy.user
      });
      return res.status(400).json({
        success: false,
        message: 'Pharmacy wallet address is required for blockchain tracking'
      });
    }

    // Parse storage requirements
    const parsedStorageReq = typeof storageRequirements === 'string' 
      ? JSON.parse(storageRequirements)
      : storageRequirements;

    // Create shipment history entry
    const shipmentEntry = {
      timestamp: new Date(),
      from: distributorName,
      fromAddress: distributorAddress,
      to: pharmacyName,
      toAddress: pharmacyWallet,
      status: status || 'In Transit',
      quantity: quantity.toString(),
      remarks: remarks || '',
      actor: {
        name: distributorName,
        type: "Distributor",
        license: distributor.registrationNumber || 'N/A',
        location: distributor.warehouseAddress || 'N/A'
      },
      environmentalConditions: {
        temperature: parsedStorageReq?.temperature || '25°C',
        humidity: parsedStorageReq?.humidity || '60%',
        status: 'Normal'
      },
      qualityCheck: {
        performedBy: req.user.name || 'QA Team',
        date: new Date(),
        result: 'Pass',
        notes: 'Pre-distribution quality check passed'
      },
      verifiedBy: {
        user: req.user.userId,
        name: req.user.name || 'Distributor Agent',
        timestamp: new Date(),
        role: 'Distributor'
      }
    };

    // Update batch with new shipment history
    batch.shipmentHistory.push(shipmentEntry);
    batch.quantityAvailable = availableQuantity - quantity;
    if (batch.quantityAvailable === 0) {
      batch.status = 'Distributed';
    }
    await batch.save();

    // Create distribution record
    const distribution = await Distribution.create({
      batchId: batch._id, // Using the actual batch ObjectId
      batchNumber,
      distributorId,
      pharmacyId: pharmacistId,
      quantity,
      remarks,
      status: 'in_transit', // Using a valid enum value from the Distribution schema
      shipmentDetails: shipmentEntry,
      assignedAt: new Date(),
      lastUpdated: new Date()
    });

    // Send successful response
    res.status(201).json({
      success: true,
      assignment: {
        id: distribution._id,
        batchNumber,
        quantity,
        status: distribution.status,
        shipmentEntry
      }
    });

  } catch (error) {
    console.error('Error assigning batch to pharmacy:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign batch',
      error: error.message
    });
  }
};

// Update shipment status
exports.updateShipmentStatus = async (req, res) => {
  try {
    const { assignmentId, status, locationUpdate, temperatureLog, notes } = req.body;
    const distributorId = req.user.userId;

    const distribution = await Distribution.findOne({
      _id: assignmentId,
      distributorId
    });

    if (!distribution) {
      return res.status(404).json({
        success: false,
        message: 'Distribution record not found'
      });
    }

    distribution.status = status;
    distribution.lastUpdated = new Date();
    
    if (locationUpdate) distribution.locationUpdates.push(locationUpdate);
    if (temperatureLog) distribution.temperatureLogs.push(...temperatureLog);
    if (notes) distribution.notes.push({ text: notes, timestamp: new Date() });

    await distribution.save();

    res.status(200).json({
      success: true,
      lastUpdated: distribution.lastUpdated
    });

  } catch (error) {
    console.error('Error updating shipment status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update status',
      error: error.message
    });
  }
};