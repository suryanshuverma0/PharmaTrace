
const Distributor = require('../models/Distributor');
const Product = require('../models/Product');
const Batch = require('../models/Batch');
const User = require('../models/User');
const Manufacturer = require('../models/Manufacturer');
const Pharmacist = require('../models/Pharmacist');
const mongoose = require('mongoose');
const { signer, batchContract, provider } = require("../utils/blockchain");

// Fetch products assigned to distributor (filter by distributor address if provided)
const getDistributorProducts = async (req, res) => {
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
    
    // If no distributor address found, return empty array (not all products)
    if (!distributorAddress && !distributorCompanyName) {
      return res.json({ products: [] });
    }
    
    // Find batches assigned to this distributor
    const batches = await Batch.find({ 
      $or: [
        { shipmentHistory: { $elemMatch: { to: distributorAddress } } },
        { shipmentHistory: { $elemMatch: { toAddress: distributorAddress } } },
        { shipmentHistory: { $elemMatch: { to: distributorCompanyName } } }
      ]
    });
    
    const batchIds = batches.map(b => b._id);
    const products = await Product.find({ batchId: { $in: batchIds } })
      .select('serialNumber productName manufacturerId status batchId batchNumber');
    
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
      }).populate('manufacturerId', 'name address');
    } else {
      batches = await Batch.find().populate('manufacturerId', 'name address');
    }
    
    // Map to frontend format
    const formatted = await Promise.all(batches.map(async b => {
      const product = await Product.findOne({ batchId: b._id });

      // Get manufacturer company name from Manufacturer model
      let manufacturerName = 'Unknown Manufacturer';
      if (b.manufacturerId) {
        const manufacturerDoc = await Manufacturer.findOne({ user: b.manufacturerId._id });
        if (manufacturerDoc && manufacturerDoc.companyName) {
          manufacturerName = manufacturerDoc.companyName;
        } else if (b.manufacturerId.name) {
          manufacturerName = b.manufacturerId.name;
        }
      }

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
        manufacturer: b.manufacturerId ? b.manufacturerId._id.toString() : '',
        manufacturerName: manufacturerName,
        manufacturerAddress: b.manufacturerId ? b.manufacturerId.address : '',
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
      
      // Get manufacturer details - try multiple approaches
      let manufacturerName = 'Unknown Manufacturer';
      let manufacturerAddress = null;
      
      // Debug logging
      console.log('Batch debug info:', {
        batchId: batch.batchNumber,
        manufacturerId: batch.manufacturerId,
        manufacturer: batch.manufacturer,
        shipmentHistoryLength: batch.shipmentHistory?.length,
        firstShipment: batch.shipmentHistory?.[0]
      });
      
      // First, try to get manufacturer from batch.manufacturerId (which refs User model)
      if (batch.manufacturerId) {
        // manufacturerId refs User model, so get user first
        const manufacturerUser = await User.findById(batch.manufacturerId);
        if (manufacturerUser) {
          // Then find the manufacturer profile for this user
          const manufacturer = await Manufacturer.findOne({ user: batch.manufacturerId });
          if (manufacturer) {
            manufacturerName = manufacturer.companyName || manufacturerUser.companyName || 'Unknown Manufacturer';
            manufacturerAddress = manufacturerUser.address;
            console.log('Found manufacturer from ID via User+Manufacturer:', manufacturerName);
          } else {
            // Fallback to user's company name if manufacturer profile doesn't exist
            manufacturerName = manufacturerUser.companyName || manufacturerUser.fullName || 'Unknown Manufacturer';
            manufacturerAddress = manufacturerUser.address;
            console.log('Found manufacturer from User only:', manufacturerName);
          }
        }
      }
      
      // If still unknown, try to get from batch.manufacturer field
      if (manufacturerName === 'Unknown Manufacturer' && batch.manufacturer) {
        manufacturerName = batch.manufacturer;
        console.log('Found manufacturer from field:', manufacturerName);
      }
      
      // If still unknown, check shipment history for manufacturer info
      if (manufacturerName === 'Unknown Manufacturer') {
        const producedEntry = batch.shipmentHistory?.find(entry => entry.status === 'Produced');
        if (producedEntry) {
          manufacturerName = producedEntry.from || producedEntry.fromAddress || manufacturerName;
          manufacturerAddress = producedEntry.fromAddress;
          console.log('Found manufacturer from shipment history:', manufacturerName);
        }
      }
      
      // Last resort: try to find manufacturer name from the shipment history "from" field
      if (manufacturerName === 'Unknown Manufacturer' && batch.shipmentHistory?.length > 0) {
        // Look for any shipment that has a "from" field that's not a wallet address
        for (const shipment of batch.shipmentHistory) {
          if (shipment.from && !shipment.from.startsWith('0x') && shipment.from.length > 10) {
            manufacturerName = shipment.from;
            console.log('Found manufacturer from any shipment:', manufacturerName);
            break;
          }
        }
      }
      
      console.log('Final manufacturer name:', manufacturerName);
      
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
          const pharmacyIdentifier = shipment.to || shipment.toAddress;
          
          // Try to get pharmacy wallet address and additional details
          let pharmacyWalletAddress = null;
          let pharmacyLocation = null;
          let pharmacyLicenseNumber = null;
          
          if (pharmacyIdentifier) {
            // First try to find pharmacy by name in Pharmacist collection
            const pharmacist = await Pharmacist.findOne({ pharmacyName: pharmacyIdentifier })
              .populate('user', 'address email phone');
            
            if (pharmacist && pharmacist.user) {
              pharmacyWalletAddress = pharmacist.user.address;
              pharmacyLocation = pharmacist.pharmacyLocation;
              pharmacyLicenseNumber = pharmacist.licenseNumber;
            } else {
              // If not found by name, check if the identifier is already a wallet address
              if (pharmacyIdentifier.startsWith('0x') && pharmacyIdentifier.length === 42) {
                pharmacyWalletAddress = pharmacyIdentifier;
                // Try to find pharmacy details by wallet address
                const userByAddress = await User.findOne({ address: pharmacyIdentifier });
                if (userByAddress) {
                  const pharmacistByUser = await Pharmacist.findOne({ user: userByAddress._id });
                  if (pharmacistByUser) {
                    pharmacyLocation = pharmacistByUser.pharmacyLocation;
                    pharmacyLicenseNumber = pharmacistByUser.licenseNumber;
                  }
                }
              }
            }
          }
          
          transfers.push({
            batchId: batch.batchNumber,
            product: productName,
            quantity: qty,
            status: shipment.status,
            to: pharmacyIdentifier,
            pharmacyWalletAddress: pharmacyWalletAddress,
            pharmacyLocation: pharmacyLocation,
            pharmacyLicenseNumber: pharmacyLicenseNumber,
            from: shipment.from || shipment.fromAddress,
            timestamp: shipment.timestamp,
            remarks: shipment.remarks,
            transactionHash: shipment.transactionHash,
            manufacturer: manufacturerName,
            manufacturerAddress: manufacturerAddress,
            // Remove environmentalConditions as requested
            // environmentalConditions: shipment.environmentalConditions,
            qualityCheck: shipment.qualityCheck,
            // Add additional useful information
            batchInfo: {
              productionDate: batch.productionDate,
              expiryDate: batch.expiryDate,
              dosageForm: batch.dosageForm,
              strength: batch.strength,
              batchNumber: batch.batchNumber,
              totalQuantity: batch.quantity
            },
            // Add shipment tracking information
            trackingInfo: {
              transactionHash: shipment.transactionHash,
              timestamp: shipment.timestamp,
              shipmentId: shipment._id
            }
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

      // Store shipment entry in blockchain as well
      try {
        console.log("📦 Adding receive acknowledgment to blockchain:", {
          batchNumber: batch.batchNumber,
          from: newShipmentEntry.from,
          to: newShipmentEntry.to,
          fromAddress: newShipmentEntry.fromAddress || '',
          toAddress: newShipmentEntry.toAddress || '',
          status: newShipmentEntry.status,
          quantity: parseInt(newShipmentEntry.quantity),
          remarks: newShipmentEntry.remarks || ''
        });

        const blockchainShipmentTx = await batchContract.addShipmentEntry(
          batch.batchNumber,
          newShipmentEntry.from,
          newShipmentEntry.to,
          newShipmentEntry.fromAddress || '0x0000000000000000000000000000000000000000',
          newShipmentEntry.toAddress || '0x0000000000000000000000000000000000000000',
          newShipmentEntry.status,
          parseInt(newShipmentEntry.quantity),
          newShipmentEntry.remarks || ''
        );

        console.log("Blockchain receive acknowledgment transaction sent, waiting for confirmation...");
        const shipmentReceipt = await blockchainShipmentTx.wait();

        if (shipmentReceipt.status !== 1) {
          throw new Error("Blockchain receive acknowledgment transaction failed");
        }

        console.log("✅ Blockchain receive acknowledgment confirmed:", shipmentReceipt.hash);
        console.log("📋 Gas used:", shipmentReceipt.gasUsed.toString());

        // Update the MongoDB shipment entry with blockchain transaction details
        const lastShipmentIndex = batch.shipmentHistory.length - 1;
        batch.shipmentHistory[lastShipmentIndex].txHash = shipmentReceipt.hash;
        batch.shipmentHistory[lastShipmentIndex].blockNumber = shipmentReceipt.blockNumber;
        await batch.save();

        console.log("✅ Shipment entry with blockchain transaction details saved to MongoDB");

      } catch (blockchainError) {
        console.error("❌ Blockchain receive acknowledgment failed:", blockchainError);
        // Continue execution even if blockchain fails - MongoDB already updated
      }
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
    
    // Get the batch for blockchain storage
    const batch = await Batch.findById(product.batchId);
    if (!batch) {
      return res.status(404).json({ message: 'Batch not found' });
    }

    await Batch.updateOne(
      { _id: product.batchId },
      { 
        $push: { shipmentHistory: newShipmentEntry }, 
        $set: { shipmentStatus: 'In Transit' } 
      }
    );

    // Store shipment entry in blockchain as well
    try {
      console.log("📦 Adding shipment to pharmacy to blockchain:", {
        batchNumber: batch.batchNumber,
        from: newShipmentEntry.from,
        to: newShipmentEntry.to,
        fromAddress: newShipmentEntry.fromAddress || '',
        toAddress: newShipmentEntry.toAddress || '',
        status: newShipmentEntry.status,
        quantity: parseInt(newShipmentEntry.quantity),
        remarks: newShipmentEntry.remarks || ''
      });

      const blockchainShipmentTx = await batchContract.addShipmentEntry(
        batch.batchNumber,
        newShipmentEntry.from,
        newShipmentEntry.to,
        newShipmentEntry.fromAddress || '0x0000000000000000000000000000000000000000',
        newShipmentEntry.toAddress || '0x0000000000000000000000000000000000000000',
        newShipmentEntry.status,
        parseInt(newShipmentEntry.quantity),
        newShipmentEntry.remarks || ''
      );

      console.log("Blockchain shipment transaction sent, waiting for confirmation...");
      const shipmentReceipt = await blockchainShipmentTx.wait();

      if (shipmentReceipt.status !== 1) {
        throw new Error("Blockchain shipment transaction failed");
      }

      console.log("✅ Blockchain shipment transaction confirmed:", shipmentReceipt.hash);
      console.log("📋 Gas used:", shipmentReceipt.gasUsed.toString());

      // Update the MongoDB shipment entry with blockchain transaction details
      await Batch.updateOne(
        { _id: product.batchId, "shipmentHistory.timestamp": newShipmentEntry.timestamp },
        { 
          $set: { 
            "shipmentHistory.$.txHash": shipmentReceipt.hash,
            "shipmentHistory.$.blockNumber": shipmentReceipt.blockNumber
          }
        }
      );

      console.log("✅ Shipment entry with blockchain transaction details saved to MongoDB");

    } catch (blockchainError) {
      console.error("❌ Blockchain shipment failed:", blockchainError);
      // Continue execution even if blockchain fails - MongoDB already updated
    }

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

    // Determine pharmacy name and address - handle both string names and addresses
    let pharmacyName = pharmacyAddress;
    let pharmacyEthAddress = '';
    
    // Check if pharmacyAddress is actually a pharmacy name, try to find the actual address
    if (pharmacyAddress && !pharmacyAddress.startsWith('0x')) {
      // It's a pharmacy name, try to find the actual address
      const pharmacyUser = await User.findOne({ 
        $or: [
          { name: { $regex: new RegExp(pharmacyAddress, 'i') } },
          { address: pharmacyAddress }
        ]
      });
      
      if (pharmacyUser && pharmacyUser.address && pharmacyUser.address.startsWith('0x')) {
        pharmacyEthAddress = pharmacyUser.address;
        pharmacyName = pharmacyUser.name || pharmacyAddress;
      } else {
        // Use a placeholder address for blockchain storage if no valid address found
        pharmacyEthAddress = '0x0000000000000000000000000000000000000000';
        pharmacyName = pharmacyAddress;
      }
    } else if (pharmacyAddress && pharmacyAddress.startsWith('0x')) {
      // It's already an Ethereum address
      pharmacyEthAddress = pharmacyAddress;
      // Try to find the pharmacy name
      const pharmacyUser = await User.findOne({ address: pharmacyAddress });
      pharmacyName = pharmacyUser ? pharmacyUser.name : pharmacyAddress;
    } else {
      // Invalid format, use placeholder
      pharmacyEthAddress = '0x0000000000000000000000000000000000000000';
      pharmacyName = pharmacyAddress || 'Unknown Pharmacy';
    }

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
      to: pharmacyName,
      toAddress: pharmacyEthAddress,
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

    // Store shipment entry in blockchain as well
    try {
      console.log("📦 Adding batch distribution to blockchain:", {
        batchNumber: batch.batchNumber,
        from: newShipmentEntry.from,
        to: newShipmentEntry.to,
        fromAddress: newShipmentEntry.fromAddress || '',
        toAddress: newShipmentEntry.toAddress || '',
        status: newShipmentEntry.status,
        quantity: parseInt(newShipmentEntry.quantity),
        remarks: newShipmentEntry.remarks || ''
      });

      const blockchainShipmentTx = await batchContract.addShipmentEntry(
        batch.batchNumber,
        newShipmentEntry.from,
        newShipmentEntry.to,
        newShipmentEntry.fromAddress || '0x0000000000000000000000000000000000000000',
        newShipmentEntry.toAddress || '0x0000000000000000000000000000000000000000',
        newShipmentEntry.status,
        parseInt(newShipmentEntry.quantity),
        newShipmentEntry.remarks || ''
      );

      console.log("Blockchain batch distribution transaction sent, waiting for confirmation...");
      const shipmentReceipt = await blockchainShipmentTx.wait();

      if (shipmentReceipt.status !== 1) {
        throw new Error("Blockchain batch distribution transaction failed");
      }

      console.log("✅ Blockchain batch distribution transaction confirmed:", shipmentReceipt.hash);
      console.log("📋 Gas used:", shipmentReceipt.gasUsed.toString());

      // Update the MongoDB shipment entry with blockchain transaction details
      const lastShipmentIndex = batch.shipmentHistory.length - 1;
      batch.shipmentHistory[lastShipmentIndex].txHash = shipmentReceipt.hash;
      batch.shipmentHistory[lastShipmentIndex].blockNumber = shipmentReceipt.blockNumber;
      await batch.save();

      console.log("✅ Batch distribution entry with blockchain transaction details saved to MongoDB");

    } catch (blockchainError) {
      console.error("❌ Blockchain batch distribution failed:", blockchainError);
      // Continue execution even if blockchain fails - MongoDB already updated
    }

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