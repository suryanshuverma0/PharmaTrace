const mongoose = require('mongoose');
const Batch = require('../models/Batch');
const Product = require('../models/Product');
const Pharmacist = require('../models/Pharmacist');
const User = require('../models/User');
const { signer, batchContract, provider } = require("../utils/blockchain");

// Get pharmacy dashboard data
const getPharmacyDashboard = async (req, res) => {
  try {
    // Set no-cache headers
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    const pharmacyUserId = req.user.userId;

    if (!pharmacyUserId) {
      return res.status(400).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Find pharmacist record
    const pharmacist = await Pharmacist.findOne({ user: pharmacyUserId })
      .populate('user', 'name email address');

    if (!pharmacist) {
      return res.status(404).json({
        success: false,
        message: 'Pharmacist not found'
      });
    }

    const pharmacyAddress = pharmacist.user?.address || pharmacist.pharmacyLocation;

    console.log('=== PHARMACY INVENTORY DEBUG ===');
    console.log('Pharmacy User ID:', pharmacyUserId);
    console.log('Pharmacist:', {
      id: pharmacist._id,
      name: pharmacist.pharmacyName,
      address: pharmacyAddress,
      userAddress: pharmacist.user?.address,
      location: pharmacist.pharmacyLocation
    });

    // Find all batches first for debugging
    const allBatches = await Batch.find({})
      .populate('manufacturerId', 'name')
      .lean();

    console.log('Total batches with shipment history:', allBatches.length);

    // Find all batches that have shipments to this pharmacy
    const batches = await Batch.find({
      shipmentHistory: {
        $elemMatch: {
          $and: [
            {
              $or: [
                { to: pharmacyAddress },
                { toAddress: pharmacyAddress },
                { to: pharmacist.pharmacyName }
              ]
            },
            {
              status: { $in: ['Delivered', 'Received', 'delivered', 'received', 'In Transit', 'in transit'] }
            }
          ]
        }
      }
    })
    .populate('manufacturerId', 'name')
    .lean();

    // Process each batch to extract pharmacy-relevant data
    const incomingBatches = [];
    const deliveredBatches = [];

    for (const batch of batches) {
      const product = await Product.findOne({ batchId: batch._id }).lean();
      
      // Find shipments to this pharmacy
      const pharmacyShipments = (batch.shipmentHistory || []).filter(entry => 
        entry.to === pharmacyAddress || 
        entry.toAddress === pharmacyAddress || 
        entry.to === pharmacist.pharmacyName
      );

      for (const shipment of pharmacyShipments) {
        const batchData = {
          distributionId: `${batch._id}_${shipment.timestamp}`,
          batchId: batch.batchNumber,
          product: product?.productName || `${batch.dosageForm || ''} ${batch.strength || ''}`.trim(),
          quantity: Number(shipment.quantity) || 0,
          status: shipment.status?.toLowerCase() || 'unknown',
          assignedAt: shipment.timestamp,
          expiryDate: product?.expiryDate || batch.expiryDate,
          manufacturer: batch.manufacturerId?.name || 'Unknown',
          distributor: shipment.from || 'Unknown',
          remarks: shipment.remarks
        };

        if (['in transit', 'pending', 'shipped'].includes(batchData.status)) {
          incomingBatches.push(batchData);
        } else if (['delivered', 'received'].includes(batchData.status)) {
          deliveredBatches.push({
            ...batchData,
            receivedAt: shipment.timestamp
          });
        }
      }
    }

    // Calculate expiry alerts (products expiring within 30 days)
    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));
    
    const expiryAlerts = deliveredBatches.filter(batch => {
      if (!batch.expiryDate) return false;
      const expiryDate = new Date(batch.expiryDate);
      return expiryDate <= thirtyDaysFromNow && expiryDate > today;
    }).map(batch => {
      const expiryDate = new Date(batch.expiryDate);
      const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
      
      return {
        ...batch,
        daysUntilExpiry
      };
    });

    // Dashboard statistics
    const stats = {
      totalIncoming: incomingBatches.length,
      totalInventory: deliveredBatches.length,
      totalExpiryAlerts: expiryAlerts.length,
      totalValue: deliveredBatches.reduce((sum, batch) => sum + (batch.quantity || 0), 0)
    };

    res.json({
      success: true,
      data: {
        pharmacy: {
          name: pharmacist.pharmacyName,
          license: pharmacist.licenseNumber,
          location: pharmacist.pharmacyLocation
        },
        stats,
        incomingBatches: incomingBatches.sort((a, b) => new Date(b.assignedAt) - new Date(a.assignedAt)),
        inventory: deliveredBatches.sort((a, b) => new Date(b.receivedAt) - new Date(a.receivedAt)),
        expiryAlerts: expiryAlerts.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry)
      }
    });

  } catch (error) {
    console.error('Error fetching pharmacy dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
      error: error.message
    });
  }
};

// Confirm receipt of a batch with verification
const confirmReceipt = async (req, res) => {
  try {
    // Set no-cache headers
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    const { distributionId } = req.params;
    const { 
      verificationDetails = {},
      environmentalConditions = {},
      qualityCheckNotes = '',
      receivedQuantity,
      damageReported = false,
      damageDetails = ''
    } = req.body;
    
    const pharmacyUserId = req.user.userId;

    if (!distributionId) {
      return res.status(400).json({
        success: false,
        message: 'Distribution ID is required'
      });
    }

    // Find pharmacist record
    const pharmacist = await Pharmacist.findOne({ user: pharmacyUserId })
      .populate('user', 'address name');

    if (!pharmacist) {
      return res.status(404).json({
        success: false,
        message: 'Pharmacist not found'
      });
    }

    const pharmacyAddress = pharmacist.user?.address || pharmacist.pharmacyLocation;

    // Parse distributionId to get batchId and timestamp (format: batchId_timestamp)
    const splitIndex = distributionId.indexOf('_');
    const batchId = distributionId.substring(0, splitIndex);
    const timestamp = distributionId.substring(splitIndex + 1);
    
    console.log('=== CONFIRM RECEIPT DEBUG ===');
    console.log('Distribution ID:', distributionId);
    console.log('Parsed Batch ID:', batchId);
    console.log('Parsed Timestamp:', timestamp);
    console.log('Pharmacy Address:', pharmacyAddress);
    console.log('Pharmacy Name:', pharmacist.pharmacyName);
    
    // Find the batch
    const batch = await Batch.findById(batchId)
      .populate('manufacturerId', 'name');
      
    if (!batch) {
      console.log('Batch not found for ID:', batchId);
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
    }

    console.log('Found batch:', {
      id: batch._id,
      batchNumber: batch.batchNumber,
      shipmentHistoryCount: batch.shipmentHistory?.length || 0
    });

    // Log all shipment entries for debugging
    batch.shipmentHistory.forEach((entry, index) => {
      console.log(`Shipment ${index}:`, {
        timestamp: entry.timestamp,
        timestampString: entry.timestamp.toString(),
        to: entry.to,
        toAddress: entry.toAddress,
        status: entry.status
      });
    });

    // Find the specific shipment entry in shipmentHistory
    // Try multiple approaches to match the timestamp and pharmacy
    const shipmentIndex = batch.shipmentHistory.findIndex(entry => {
      const entryTimeString = entry.timestamp.toString();
      const isTimestampMatch = entryTimeString === timestamp || 
                              entry.timestamp.getTime() === new Date(timestamp).getTime();
      
      const isPharmacyMatch = entry.to === pharmacyAddress || 
                             entry.toAddress === pharmacyAddress || 
                             entry.to === pharmacist.pharmacyName;
      
      console.log(`Checking shipment entry:`, {
        entryTimeString,
        timestamp,
        isTimestampMatch,
        isPharmacyMatch,
        entryTo: entry.to,
        entryToAddress: entry.toAddress
      });
      
      return isTimestampMatch && isPharmacyMatch;
    });

    if (shipmentIndex === -1) {
      console.log('=== SHIPMENT NOT FOUND ===');
      console.log('Could not find matching shipment entry');
      console.log('Available shipments to this pharmacy:');
      
      const pharmacyShipments = batch.shipmentHistory.filter(entry => 
        entry.to === pharmacyAddress || 
        entry.toAddress === pharmacyAddress || 
        entry.to === pharmacist.pharmacyName
      );
      
      pharmacyShipments.forEach((entry, index) => {
        console.log(`Available shipment ${index}:`, {
          timestamp: entry.timestamp.toString(),
          to: entry.to,
          toAddress: entry.toAddress,
          status: entry.status,
          quantity: entry.quantity
        });
      });
      
      return res.status(404).json({
        success: false,
        message: 'Shipment record not found. Please check the shipment details.',
        debug: {
          batchId,
          timestamp,
          pharmacyAddress,
          availableShipments: pharmacyShipments.length
        }
      });
    }

    const originalShipment = batch.shipmentHistory[shipmentIndex];

    // Check if already confirmed
    if (['delivered', 'received'].includes(originalShipment.status?.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Batch already confirmed as received'
      });
    }

    // Validate received quantity
    const expectedQuantity = Number(originalShipment.quantity) || 0;
    const actualReceivedQty = receivedQuantity ? Number(receivedQuantity) : expectedQuantity;
    
    if (actualReceivedQty > expectedQuantity) {
      return res.status(400).json({
        success: false,
        message: `Received quantity (${actualReceivedQty}) cannot exceed shipped quantity (${expectedQuantity})`
      });
    }

    // Determine quality check result
    const qualityResult = damageReported ? 'Fail' : 'Pass';
    const quantityDiscrepancy = actualReceivedQty !== expectedQuantity;
    
    // Update the existing shipment entry with confirmation details (don't create new entry)
    batch.shipmentHistory[shipmentIndex].status = 'Received';
    batch.shipmentHistory[shipmentIndex].quantity = actualReceivedQty.toString();
    batch.shipmentHistory[shipmentIndex].lastUpdated = new Date();
    batch.shipmentHistory[shipmentIndex].remarks = `Receipt confirmed by pharmacy. ${quantityDiscrepancy ? `Quantity discrepancy: Expected ${expectedQuantity}, Received ${actualReceivedQty}. ` : ''}${damageReported ? `Damage reported: ${damageDetails}. ` : ''}${qualityCheckNotes || 'Standard verification completed.'}`;
    
    // Add detailed verification data to the existing entry
    batch.shipmentHistory[shipmentIndex].actor = {
      name: pharmacist.pharmacyName,
      type: 'Pharmacy',
      license: pharmacist.licenseNumber,
      location: pharmacist.pharmacyLocation,
      verifiedBy: pharmacist.user?.name || 'Pharmacy Staff'
    };
    
    batch.shipmentHistory[shipmentIndex].environmentalConditions = {
      temperature: environmentalConditions.temperature || '22°C',
      humidity: environmentalConditions.humidity || '60%',
      status: environmentalConditions.status || 'Normal',
      checkTime: new Date(),
      location: 'Pharmacy Storage'
    };
    
    batch.shipmentHistory[shipmentIndex].qualityCheck = {
      performedBy: pharmacist.user?.name || pharmacist.pharmacyName,
      date: new Date(),
      result: qualityResult,
      notes: qualityCheckNotes || 'Visual inspection completed',
      damageReported,
      damageDetails: damageReported ? damageDetails : null,
      quantityVerified: true,
      expectedQuantity,
      receivedQuantity: actualReceivedQty,
      quantityDiscrepancy,
      verificationMethod: verificationDetails.method || 'Manual Count',
      packageIntegrity: verificationDetails.packageIntegrity || 'Good',
      sealStatus: verificationDetails.sealStatus || 'Intact'
    };

    batch.shipmentHistory[shipmentIndex].verification = {
      verifiedAt: new Date(),
      verifiedBy: {
        userId: pharmacyUserId,
        name: pharmacist.user?.name || pharmacist.pharmacyName,
        role: 'Pharmacist',
        license: pharmacist.licenseNumber
      },
      batchInfo: {
        batchNumber: batch.batchNumber,
        manufacturer: batch.manufacturerId?.name || 'Unknown',
        expiryDate: batch.expiryDate
      },
      receiptConfirmed: true,
      digitalSignature: `PH_${pharmacist.licenseNumber}_${Date.now()}`
    };

    // Save the batch with new shipment history
    await batch.save();

    // Store confirmation in blockchain
    try {
      const blockchainShipmentData = {
        batchNumber: batch.batchNumber,
        timestamp: Math.floor(Date.now() / 1000),
        from: originalShipment.from || 'Unknown Distributor',
        to: pharmacist.pharmacyName,
        fromAddress: originalShipment.fromAddress || '',
        toAddress: pharmacyAddress,
        status: 'Received',
        quantity: actualReceivedQty.toString(),
        remarks: `Receipt confirmed by ${pharmacist.pharmacyName}. ${qualityResult === 'Pass' ? 'Quality check passed.' : 'Quality issues reported.'} ${quantityDiscrepancy ? `Quantity discrepancy: Expected ${expectedQuantity}, Received ${actualReceivedQty}.` : ''} ${damageReported ? `Damage reported: ${damageDetails}` : ''} Verified by: ${pharmacist.user?.name || 'Pharmacy Staff'}`
      };

      console.log('=== STORING PHARMACY RECEIPT IN BLOCKCHAIN ===');
      console.log('Shipment data:', blockchainShipmentData);
      
      const tx = await batchContract.addShipmentEntry(
        blockchainShipmentData.batchNumber,
        blockchainShipmentData.from,
        blockchainShipmentData.to,
        blockchainShipmentData.fromAddress || '0x0000000000000000000000000000000000000000',
        blockchainShipmentData.toAddress || '0x0000000000000000000000000000000000000000',
        blockchainShipmentData.status,
        parseInt(blockchainShipmentData.quantity),
        blockchainShipmentData.remarks
      );

      const receipt = await tx.wait();
      console.log('Blockchain confirmation transaction hash:', receipt.transactionHash);
      console.log('Block number:', receipt.blockNumber);
      console.log('=== PHARMACY RECEIPT STORED IN BLOCKCHAIN ===');
      
    } catch (blockchainError) {
      console.error('Failed to store pharmacy receipt in blockchain:', blockchainError);
      // Continue with the response even if blockchain fails
      console.log('MongoDB operation completed successfully, blockchain storage failed');
    }

    // Log the confirmation for audit trail
    console.log('=== PHARMACY RECEIPT CONFIRMATION ===');
    console.log(`Pharmacy: ${pharmacist.pharmacyName}`);
    console.log(`Batch: ${batch.batchNumber}`);
    console.log(`Expected Qty: ${expectedQuantity}, Received Qty: ${actualReceivedQty}`);
    console.log(`Quality Check: ${qualityResult}`);
    console.log(`Damage Reported: ${damageReported}`);
    console.log(`Verified By: ${pharmacist.user?.name || pharmacist.pharmacyName}`);
    console.log('==========================================');

    res.json({
      success: true,
      message: 'Receipt confirmed successfully',
      data: {
        distributionId,
        batchId: batch.batchNumber,
        batchNumber: batch.batchNumber,
        status: 'received',
        confirmedAt: new Date(),
        confirmedBy: pharmacist.user?.name || pharmacist.pharmacyName,
        expectedQuantity,
        receivedQuantity: actualReceivedQty,
        qualityCheck: qualityResult,
        damageReported,
        verification: batch.shipmentHistory[shipmentIndex].verification
      }
    });

  } catch (error) {
    console.error('Error confirming receipt:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to confirm receipt',
      error: error.message
    });
  }
};

// Get expiry alerts
const getExpiryAlerts = async (req, res) => {
  try {
    // Set no-cache headers
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    const pharmacyUserId = req.user.userId;
    const { days = 30 } = req.query; // Default to 30 days

    console.log('=== EXPIRY ALERTS DEBUG ===');
    console.log('Alert threshold days:', days);

    // Find pharmacist record
    const pharmacist = await Pharmacist.findOne({ user: pharmacyUserId })
      .populate('user', 'address');

    if (!pharmacist) {
      return res.status(404).json({
        success: false,
        message: 'Pharmacist not found'
      });
    }

    const pharmacyAddress = pharmacist.user?.address || pharmacist.pharmacyLocation;

    console.log('Pharmacy address:', pharmacyAddress);
    console.log('Pharmacy name:', pharmacist.pharmacyName);

    // Find all batches that have deliveries to this pharmacy
    const batches = await Batch.find({
      shipmentHistory: {
        $elemMatch: {
          $and: [
            {
              $or: [
                { to: pharmacyAddress },
                { toAddress: pharmacyAddress },
                { to: pharmacist.pharmacyName }
              ]
            },
            {
              status: { $in: ['Delivered', 'Received', 'delivered', 'received'] }
            }
          ]
        }
      }
    })
    .populate('manufacturerId', 'name')
    .lean();

    console.log('Found batches for expiry check:', batches.length);

    const today = new Date();
    const alertThreshold = new Date(today.getTime() + (parseInt(days) * 24 * 60 * 60 * 1000));
    
    console.log('Today:', today.toDateString());
    console.log('Alert threshold:', alertThreshold.toDateString());
    
    const expiryAlerts = [];

    for (const batch of batches) {
      const product = await Product.findOne({ batchId: batch._id }).lean();
      const expiryDate = product?.expiryDate || batch.expiryDate;
      
      if (!expiryDate) {
        console.log(`No expiry date for batch ${batch.batchNumber}`);
        continue;
      }
      
      const expiry = new Date(expiryDate);
      const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
      
      console.log(`Batch ${batch.batchNumber}: expires in ${daysUntilExpiry} days (${expiry.toDateString()})`);
      
      // Check if within alert threshold OR if it's expired
      if (expiry <= alertThreshold || expiry <= today) {
        // Find delivered shipments to this pharmacy
        const deliveredShipments = (batch.shipmentHistory || []).filter(entry => 
          (entry.to === pharmacyAddress || entry.toAddress === pharmacyAddress || entry.to === pharmacist.pharmacyName) &&
          ['delivered', 'received', 'Delivered', 'Received'].includes(entry.status)
        );

        console.log(`Batch ${batch.batchNumber} within threshold, found ${deliveredShipments.length} delivered shipments`);

        for (const shipment of deliveredShipments) {
          expiryAlerts.push({
            distributionId: `${batch._id}_${shipment.timestamp}`,
            batchId: batch.batchNumber,
            product: product?.productName || `${batch.dosageForm || ''} ${batch.strength || ''}`.trim(),
            quantity: Number(shipment.quantity) || 0,
            expiryDate: expiryDate,
            daysUntilExpiry,
            manufacturer: batch.manufacturerId?.name || 'Unknown',
            distributor: shipment.from || 'Unknown',
            receivedAt: shipment.timestamp,
            alertLevel: daysUntilExpiry <= 0 ? 'expired' : daysUntilExpiry <= 7 ? 'critical' : daysUntilExpiry <= 15 ? 'warning' : 'info'
          });
        }
      }
    }

    const sortedAlerts = expiryAlerts.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);

    console.log('Final expiry alerts count:', sortedAlerts.length);
    console.log('=== END EXPIRY ALERTS DEBUG ===');

    res.json({
      success: true,
      data: {
        alerts: sortedAlerts,
        totalAlerts: sortedAlerts.length,
        criticalAlerts: sortedAlerts.filter(alert => alert.alertLevel === 'critical' || alert.alertLevel === 'expired').length,
        warningAlerts: sortedAlerts.filter(alert => alert.alertLevel === 'warning').length,
        alertThresholdDays: parseInt(days),
        debugInfo: {
          batchesFound: batches.length,
          alertThreshold: alertThreshold.toISOString(),
          pharmacyAddress,
          pharmacyName: pharmacist.pharmacyName
        }
      }
    });

  } catch (error) {
    console.error('Error fetching expiry alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch expiry alerts',
      error: error.message
    });
  }
};

// Get pharmacy inventory
const getInventory = async (req, res) => {
  try {
    // Set no-cache headers
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    const pharmacyUserId = req.user.userId;

    // Find pharmacist record
    const pharmacist = await Pharmacist.findOne({ user: pharmacyUserId })
      .populate('user', 'address');

    if (!pharmacist) {
      return res.status(404).json({
        success: false,
        message: 'Pharmacist not found'
      });
    }

    const pharmacyAddress = pharmacist.user?.address || pharmacist.pharmacyLocation;

    // Find all batches that have deliveries to this pharmacy
    const batches = await Batch.find({
      shipmentHistory: {
        $elemMatch: {
          $and: [
            {
              $or: [
                { to: pharmacyAddress },
                { toAddress: pharmacyAddress },
                { to: pharmacist.pharmacyName }
              ]
            },
            {
              status: { $in: ['Delivered', 'Received', 'delivered', 'received'] }
            }
          ]
        }
      }
    })
    .populate('manufacturerId', 'name')
    .lean();

    console.log('Found batches with shipments to pharmacy:', batches.length);
    if (batches.length > 0) {
      console.log('Sample batch:', {
        id: batches[0]._id,
        batchNumber: batches[0].batchNumber,
        shipmentHistoryCount: batches[0].shipmentHistory?.length || 0
      });
    }

    const formattedInventory = [];

    for (const batch of batches) {
      const product = await Product.findOne({ batchId: batch._id }).lean();
      
      // Find delivered shipments to this pharmacy
      const deliveredShipments = (batch.shipmentHistory || []).filter(entry => 
        (entry.to === pharmacyAddress || entry.toAddress === pharmacyAddress || entry.to === pharmacist.pharmacyName) &&
        ['delivered', 'received', 'Delivered', 'Received'].includes(entry.status)
      );

      console.log(`Batch ${batch.batchNumber}: found ${deliveredShipments.length} delivered shipments`);
      if (deliveredShipments.length > 0) {
        console.log('Sample shipment:', deliveredShipments[0]);
      }

      for (const shipment of deliveredShipments) {
        const today = new Date();
        const expiryDate = product?.expiryDate || batch.expiryDate;
        const daysUntilExpiry = expiryDate ? Math.ceil((new Date(expiryDate) - today) / (1000 * 60 * 60 * 24)) : null;
        
        formattedInventory.push({
          distributionId: `${batch._id}_${shipment.timestamp}`,
          batchId: batch.batchNumber,
          product: product?.productName || `${batch.dosageForm || ''} ${batch.strength || ''}`.trim(),
          quantity: Number(shipment.quantity) || 0,
          expiryDate: expiryDate,
          daysUntilExpiry,
          manufacturer: batch.manufacturerId?.name || 'Unknown',
          distributor: shipment.from || 'Unknown',
          receivedAt: shipment.timestamp,
          status: !daysUntilExpiry ? 'unknown' : 
                  daysUntilExpiry <= 0 ? 'expired' : 
                  daysUntilExpiry <= 30 ? 'expiring' : 'good'
        });
      }
    }

    // Sort by received date (most recent first)
    const sortedInventory = formattedInventory.sort((a, b) => new Date(b.receivedAt) - new Date(a.receivedAt));

    console.log('Final formatted inventory count:', sortedInventory.length);
    console.log('=== END PHARMACY INVENTORY DEBUG ===');

    res.json({
      success: true,
      data: sortedInventory,
      totalItems: sortedInventory.length,
      totalQuantity: sortedInventory.reduce((sum, item) => sum + item.quantity, 0)
    });

  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inventory',
      error: error.message
    });
  }
};

const getAllPharmacies = async (req, res) => {
  try {
    // Perform aggregation to fetch pharmacies with associated user data
    const pharmacies = await Pharmacist.aggregate([
      {
        $lookup: {
          from: 'users', // Collection name in MongoDB (lowercase, plural)
          localField: 'user',
          foreignField: '_id',
          as: 'userData'
        }
      },
      {
        $unwind: {
          path: '$userData',
          preserveNullAndEmptyArrays: false // Only include pharmacists with matching users
        }
      },
      {
        $match: {
          'userData.isActive': true // Only include active users
        }
      },
      {
        $project: {
          userId: '$userData._id',
          address: '$userData.address',
          pharmacyId: '$_id',
          pharmacyName: 1,
          pharmacyLocation: 1
        }
      }
    ]);

    console.log('Fetched pharmacies:', pharmacies.length);

    res.status(200).json({
      success: true,
      data: pharmacies
    });
  } catch (error) {
    console.error('Error fetching pharmacies:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pharmacies',
      details: error.message
    });
  }
};

module.exports = { 
  getAllPharmacies,
  getPharmacyDashboard,
  confirmReceipt,
  getExpiryAlerts,
  getInventory
};