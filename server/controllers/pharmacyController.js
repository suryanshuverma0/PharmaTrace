const mongoose = require('mongoose');
const Distribution = require('../models/Distribution');
const Batch = require('../models/Batch');
const Product = require('../models/Product');
const Pharmacist = require('../models/Pharmacist');
const User = require('../models/User');

// Get pharmacy dashboard data
const getPharmacyDashboard = async (req, res) => {
  try {
    const pharmacyUserId = req.user.userId;

    if (!pharmacyUserId) {
      return res.status(400).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Find pharmacist record
    const pharmacist = await Pharmacist.findOne({ user: pharmacyUserId })
      .populate('user', 'name email');

    if (!pharmacist) {
      return res.status(404).json({
        success: false,
        message: 'Pharmacist not found'
      });
    }

    // Get incoming batches (pending and in_transit)
    const incomingBatches = await Distribution.find({
      pharmacyId: pharmacist._id,
      status: { $in: ['pending', 'in_transit'] }
    })
    .populate({
      path: 'batchId',
      populate: {
        path: 'manufacturerId',
        model: 'User',
        select: 'name'
      }
    })
    .populate('distributorId', 'companyName')
    .sort({ assignedAt: -1 });

    // Get delivered inventory
    const deliveredBatches = await Distribution.find({
      pharmacyId: pharmacist._id,
      status: 'delivered'
    })
    .populate({
      path: 'batchId',
      populate: {
        path: 'manufacturerId',
        model: 'User',
        select: 'name'
      }
    })
    .populate('distributorId', 'companyName')
    .sort({ lastUpdated: -1 });

    // Calculate expiry alerts (products expiring within 30 days)
    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));
    
    const expiryAlerts = deliveredBatches.filter(distribution => {
      const expiryDate = new Date(distribution.batchId.expiryDate);
      return expiryDate <= thirtyDaysFromNow && expiryDate > today;
    }).map(distribution => {
      const expiryDate = new Date(distribution.batchId.expiryDate);
      const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
      
      return {
        distributionId: distribution._id,
        batchId: distribution.batchId.batchNumber,
        product: `${distribution.batchId.dosageForm} ${distribution.batchId.strength}`,
        quantity: distribution.quantity,
        expiryDate: distribution.batchId.expiryDate,
        daysUntilExpiry,
        manufacturer: distribution.batchId.manufacturerId?.name || 'Unknown'
      };
    });

    // Format incoming batches
    const formattedIncomingBatches = incomingBatches.map(distribution => ({
      distributionId: distribution._id,
      batchId: distribution.batchId.batchNumber,
      product: `${distribution.batchId.dosageForm} ${distribution.batchId.strength}`,
      quantity: distribution.quantity,
      status: distribution.status,
      assignedAt: distribution.assignedAt,
      expiryDate: distribution.batchId.expiryDate,
      manufacturer: distribution.batchId.manufacturerId?.name || 'Unknown',
      distributor: distribution.distributorId?.companyName || 'Unknown',
      remarks: distribution.remarks
    }));

    // Format inventory
    const formattedInventory = deliveredBatches.map(distribution => ({
      distributionId: distribution._id,
      batchId: distribution.batchId.batchNumber,
      product: `${distribution.batchId.dosageForm} ${distribution.batchId.strength}`,
      quantity: distribution.quantity,
      expiryDate: distribution.batchId.expiryDate,
      receivedAt: distribution.lastUpdated,
      manufacturer: distribution.batchId.manufacturerId?.name || 'Unknown',
      distributor: distribution.distributorId?.companyName || 'Unknown'
    }));

    // Dashboard statistics
    const stats = {
      totalIncoming: incomingBatches.length,
      totalInventory: deliveredBatches.length,
      totalExpiryAlerts: expiryAlerts.length,
      totalValue: deliveredBatches.reduce((sum, dist) => sum + (dist.quantity || 0), 0)
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
        incomingBatches: formattedIncomingBatches,
        inventory: formattedInventory,
        expiryAlerts
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

// Confirm receipt of a batch
const confirmReceipt = async (req, res) => {
  try {
    const { distributionId } = req.params;
    const pharmacyUserId = req.user.userId;

    if (!distributionId) {
      return res.status(400).json({
        success: false,
        message: 'Distribution ID is required'
      });
    }

    // Find pharmacist record
    const pharmacist = await Pharmacist.findOne({ user: pharmacyUserId });
    if (!pharmacist) {
      return res.status(404).json({
        success: false,
        message: 'Pharmacist not found'
      });
    }

    // Find the distribution
    const distribution = await Distribution.findById(distributionId)
      .populate('batchId')
      .populate('pharmacyId');

    if (!distribution) {
      return res.status(404).json({
        success: false,
        message: 'Distribution record not found'
      });
    }

    // Verify pharmacy ownership
    if (distribution.pharmacyId._id.toString() !== pharmacist._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to confirm this receipt'
      });
    }

    // Check if already delivered
    if (distribution.status === 'delivered') {
      return res.status(400).json({
        success: false,
        message: 'Batch already confirmed as delivered'
      });
    }

    // Update distribution status
    distribution.status = 'delivered';
    distribution.lastUpdated = new Date();
    
    // Add to location updates
    distribution.locationUpdates.push({
      latitude: 0, // Can be updated with actual location
      longitude: 0,
      timestamp: new Date(),
      description: 'Delivered and confirmed by pharmacy'
    });

    await distribution.save();

    // Update batch shipment history
    const batch = distribution.batchId;
    batch.shipmentHistory.push({
      timestamp: new Date(),
      from: 'Distributor',
      to: 'Pharmacy',
      status: 'Delivered',
      quantity: distribution.quantity.toString(),
      remarks: `Confirmed delivery to ${distribution.pharmacyId.pharmacyName}`,
      actor: {
        name: distribution.pharmacyId.pharmacyName,
        type: 'Pharmacy',
        license: distribution.pharmacyId.licenseNumber,
        location: distribution.pharmacyId.pharmacyLocation
      },
      verifiedBy: {
        user: distribution.pharmacyId.user,
        timestamp: new Date(),
        role: 'pharmacist'
      },
      qualityCheck: {
        performedBy: distribution.pharmacyId.pharmacyName,
        date: new Date(),
        result: 'Pass',
        notes: 'Products received in good condition'
      }
    });

    await batch.save();

    res.json({
      success: true,
      message: 'Receipt confirmed successfully',
      data: {
        distributionId: distribution._id,
        status: distribution.status,
        confirmedAt: distribution.lastUpdated
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
    const pharmacyUserId = req.user.userId;
    const { days = 30 } = req.query; // Default to 30 days

    // Find pharmacist record
    const pharmacist = await Pharmacist.findOne({ user: pharmacyUserId });

    if (!pharmacist) {
      return res.status(404).json({
        success: false,
        message: 'Pharmacist not found'
      });
    }

    // Get delivered inventory
    const deliveredBatches = await Distribution.find({
      pharmacyId: pharmacist._id,
      status: 'delivered'
    })
    .populate({
      path: 'batchId',
      populate: {
        path: 'manufacturerId',
        model: 'User',
        select: 'name'
      }
    })
    .populate('distributorId', 'companyName');

    // Calculate expiry alerts
    const today = new Date();
    const alertThreshold = new Date(today.getTime() + (parseInt(days) * 24 * 60 * 60 * 1000));
    
    const expiryAlerts = deliveredBatches
      .filter(distribution => {
        const expiryDate = new Date(distribution.batchId.expiryDate);
        return expiryDate <= alertThreshold && expiryDate > today;
      })
      .map(distribution => {
        const expiryDate = new Date(distribution.batchId.expiryDate);
        const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
        
        return {
          distributionId: distribution._id,
          batchId: distribution.batchId.batchNumber,
          product: `${distribution.batchId.dosageForm} ${distribution.batchId.strength}`,
          quantity: distribution.quantity,
          expiryDate: distribution.batchId.expiryDate,
          daysUntilExpiry,
          manufacturer: distribution.batchId.manufacturerId?.name || 'Unknown',
          distributor: distribution.distributorId?.companyName || 'Unknown',
          receivedAt: distribution.lastUpdated,
          alertLevel: daysUntilExpiry <= 7 ? 'critical' : daysUntilExpiry <= 15 ? 'warning' : 'info'
        };
      })
      .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);

    res.json({
      success: true,
      data: {
        alerts: expiryAlerts,
        totalAlerts: expiryAlerts.length,
        criticalAlerts: expiryAlerts.filter(alert => alert.alertLevel === 'critical').length,
        warningAlerts: expiryAlerts.filter(alert => alert.alertLevel === 'warning').length
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
    const pharmacyUserId = req.user.userId;

    // Find pharmacist record
    const pharmacist = await Pharmacist.findOne({ user: pharmacyUserId });

    if (!pharmacist) {
      return res.status(404).json({
        success: false,
        message: 'Pharmacist not found'
      });
    }

    // Get delivered inventory
    const inventory = await Distribution.find({
      pharmacyId: pharmacist._id,
      status: 'delivered'
    })
    .populate({
      path: 'batchId',
      populate: {
        path: 'manufacturerId',
        model: 'User',
        select: 'name'
      }
    })
    .populate('distributorId', 'companyName')
    .sort({ lastUpdated: -1 });

    const formattedInventory = inventory.map(distribution => {
      const today = new Date();
      const expiryDate = new Date(distribution.batchId.expiryDate);
      const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
      
      return {
        distributionId: distribution._id,
        batchId: distribution.batchId.batchNumber,
        product: `${distribution.batchId.dosageForm} ${distribution.batchId.strength}`,
        quantity: distribution.quantity,
        expiryDate: distribution.batchId.expiryDate,
        daysUntilExpiry,
        manufacturer: distribution.batchId.manufacturerId?.name || 'Unknown',
        distributor: distribution.distributorId?.companyName || 'Unknown',
        receivedAt: distribution.lastUpdated,
        status: daysUntilExpiry <= 0 ? 'expired' : daysUntilExpiry <= 30 ? 'expiring' : 'good'
      };
    });

    res.json({
      success: true,
      data: {
        inventory: formattedInventory,
        totalItems: formattedInventory.length,
        totalQuantity: formattedInventory.reduce((sum, item) => sum + item.quantity, 0)
      }
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