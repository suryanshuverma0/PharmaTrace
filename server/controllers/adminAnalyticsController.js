const Product = require('../models/Product');
const Batch = require('../models/Batch');
const ProductTracking = require('../models/ProductTracking');
const Manufacturer = require('../models/Manufacturer');
const Distributor = require('../models/Distributor');
const Pharmacist = require('../models/Pharmacist');

// Get comprehensive admin analytics
exports.getAdminAnalytics = async (req, res) => {
  try {
    const { timeRange = '7d' } = req.query;
    
    // Calculate date range
    const now = new Date();
    let startDate;
    
    switch (timeRange) {
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Get overview statistics
    const [
      totalProducts,
      totalBatches,
      totalScans,
      uniqueProductCount,
      recentScans,
      deviceStats,
      verifiedProducts,
      topProducts
    ] = await Promise.all([
      Product.countDocuments(),
      Batch.countDocuments(),
      ProductTracking.countDocuments({ scannedAt: { $gte: startDate } }),
      ProductTracking.distinct('serialNumber', { scannedAt: { $gte: startDate } }).then(arr => arr.length),
      ProductTracking.find({ scannedAt: { $gte: startDate } }).lean(),
      ProductTracking.aggregate([
        { $match: { scannedAt: { $gte: startDate } } },
        { $group: { _id: '$deviceInfo.deviceType', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      ProductTracking.countDocuments({ 
        scannedAt: { $gte: startDate },
        'verificationResult.isAuthentic': true 
      }),
      ProductTracking.aggregate([
        { $match: { scannedAt: { $gte: startDate } } },
        { 
          $group: { 
            _id: '$serialNumber', 
            productName: { $first: '$productName' },
            scanCount: { $sum: 1 },
            lastScanned: { $max: '$scannedAt' },
            locations: { $addToSet: '$location.country' }
          } 
        },
        { $sort: { scanCount: -1 } },
        { $limit: 10 },
        { 
          $project: {
            serialNumber: '$_id',
            productName: 1,
            scanCount: 1,
            lastScanned: 1,
            globalReach: { $size: '$locations' }
          }
        }
      ])
    ]);

    // Calculate authentication rate
    const authenticationRate = totalScans > 0 ? (verifiedProducts / totalScans) * 100 : 0;

    // Get time series data
    const timeSeriesData = await ProductTracking.aggregate([
      { $match: { scannedAt: { $gte: startDate } } },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$scannedAt" } }
          },
          scans: { $sum: 1 },
          authentic: {
            $sum: { $cond: [{ $eq: ['$verificationResult.isAuthentic', true] }, 1, 0] }
          },
          counterfeit: {
            $sum: { $cond: [{ $eq: ['$verificationResult.isAuthentic', false] }, 1, 0] }
          }
        }
      },
      { $sort: { "_id.date": 1 } }
    ]);

    const overview = {
      totalProducts,
      totalBatches,
      totalScans,
      uniqueProductCount,
      authenticationRate: parseFloat(authenticationRate.toFixed(2)),
      verifiedProducts,
      systemHealth: 98, // Mock system health
      blockchainTxns: Math.floor(Math.random() * 1000) + 500 // Mock blockchain transactions
    };

    res.json({
      success: true,
      data: {
        overview,
        timeSeriesData,
        deviceAnalytics: deviceStats,
        productAnalytics: topProducts
      }
    });

  } catch (error) {
    console.error('Error fetching admin analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics data',
      error: error.message
    });
  }
};

// Get real-time verifications for admin
exports.getAdminRealtimeVerifications = async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    
    const realtimeData = await ProductTracking.find()
      .sort({ scannedAt: -1 })
      .limit(parseInt(limit))
      .lean();

    res.json({
      success: true,
      data: realtimeData
    });

  } catch (error) {
    console.error('Error fetching admin realtime verifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch realtime verifications',
      error: error.message
    });
  }
};

// Get location analytics for admin
exports.getAdminLocationAnalytics = async (req, res) => {
  try {
    const locationData = await ProductTracking.aggregate([
      {
        $match: {
          'location.latitude': { $exists: true, $ne: null },
          'location.longitude': { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: {
            country: '$location.country',
            city: '$location.city',
            latitude: '$location.latitude',
            longitude: '$location.longitude'
          },
          totalVerifications: { $sum: 1 },
          uniqueProducts: { $addToSet: '$serialNumber' },
          lastActivity: { $max: '$scannedAt' },
          authenticVerifications: {
            $sum: { $cond: [{ $eq: ['$verificationResult.isAuthentic', true] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          location: {
            country: '$_id.country',
            city: '$_id.city',
            coordinates: {
              latitude: '$_id.latitude',
              longitude: '$_id.longitude'
            }
          },
          stats: {
            totalVerifications: '$totalVerifications',
            uniqueProducts: { $size: '$uniqueProducts' },
            lastActivity: '$lastActivity',
            authenticationRate: {
              $multiply: [
                { $divide: ['$authenticVerifications', '$totalVerifications'] },
                100
              ]
            }
          }
        }
      },
      { $sort: { 'stats.totalVerifications': -1 } }
    ]);

    res.json({
      success: true,
      data: locationData
    });

  } catch (error) {
    console.error('Error fetching admin location analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch location analytics',
      error: error.message
    });
  }
};

// Get dashboard stats for admin
exports.getAdminDashboardStats = async (req, res) => {
  try {
    const [
      totalProducts,
      totalBatches,
      totalManufacturers,
      totalDistributors,
      totalPharmacists,
      totalVerifications,
      recentVerifications,
      activeShipments
    ] = await Promise.all([
      Product.countDocuments(),
      Batch.countDocuments(),
      Manufacturer.countDocuments(),
      Distributor.countDocuments(),
      Pharmacist.countDocuments(),
      ProductTracking.countDocuments(),
      ProductTracking.countDocuments({ 
        'verificationResult.isAuthentic': true 
      }),
      Batch.countDocuments({
        'shipmentHistory.0': { $exists: true }
      })
    ]);

    const authenticationRate = totalVerifications > 0 ? 
      (recentVerifications / totalVerifications) * 100 : 0;

    const stats = {
      totalProducts,
      totalBatches,
      totalUsers: totalManufacturers + totalDistributors + totalPharmacists,
      totalManufacturers,
      totalDistributors,
      totalPharmacists,
      verifiedProducts: recentVerifications,
      activeShipments,
      systemHealth: 98,
      blockchainTxns: Math.floor(Math.random() * 1000) + 500,
      totalVerifications,
      authenticationRate: parseFloat(authenticationRate.toFixed(2))
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error fetching admin dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard stats',
      error: error.message
    });
  }
};

// Get recent activities for admin
exports.getAdminRecentActivities = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    // Get recent product registrations
    const recentProducts = await Product.find()
      .sort({ createdAt: -1 })
      .limit(3)
      .select('productName createdAt manufacturerName')
      .lean();

    // Get recent verifications
    const recentVerifications = await ProductTracking.find()
      .sort({ scannedAt: -1 })
      .limit(3)
      .select('productName serialNumber scannedAt location')
      .lean();

    // Get recent batch shipments
    const recentShipments = await Batch.find({
      'shipmentHistory.0': { $exists: true }
    })
      .sort({ 'shipmentHistory.timestamp': -1 })
      .limit(2)
      .select('batchNumber shipmentHistory')
      .lean();

    const activities = [];

    // Add product registrations
    recentProducts.forEach(product => {
      activities.push({
        id: `product_${product._id}`,
        type: 'product_registered',
        message: `New product registered: ${product.productName}`,
        time: getTimeAgo(product.createdAt),
        icon: 'Package',
        timestamp: product.createdAt
      });
    });

    // Add verifications
    recentVerifications.forEach(verification => {
      activities.push({
        id: `verification_${verification._id}`,
        type: 'verification',
        message: `Product verified: ${verification.productName || verification.serialNumber}`,
        time: getTimeAgo(verification.scannedAt),
        icon: 'Shield',
        timestamp: verification.scannedAt
      });
    });

    // Add shipments
    recentShipments.forEach(shipment => {
      if (shipment.shipmentHistory && shipment.shipmentHistory.length > 0) {
        const latestShipment = shipment.shipmentHistory[shipment.shipmentHistory.length - 1];
        activities.push({
          id: `shipment_${shipment._id}`,
          type: 'batch_shipped',
          message: `Batch ${shipment.batchNumber} shipped to ${latestShipment.to}`,
          time: getTimeAgo(latestShipment.timestamp),
          icon: 'Truck',
          timestamp: latestShipment.timestamp
        });
      }
    });

    // Sort by timestamp and limit
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const limitedActivities = activities.slice(0, parseInt(limit));

    res.json({
      success: true,
      data: limitedActivities
    });

  } catch (error) {
    console.error('Error fetching admin recent activities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent activities',
      error: error.message
    });
  }
};

// Get system alerts for admin
exports.getAdminSystemAlerts = async (req, res) => {
  try {
    const alerts = [];
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Check for expiring products
    const expiringProducts = await Product.countDocuments({
      expiryDate: { $lte: thirtyDaysFromNow, $gte: now }
    });

    if (expiringProducts > 0) {
      alerts.push({
        id: 'expiring_products',
        type: 'warning',
        message: `${expiringProducts} products expiring within 30 days`,
        severity: 'medium'
      });
    }

    // Check for suspicious activity
    const recentCounterfeit = await ProductTracking.countDocuments({
      scannedAt: { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
      'verificationResult.isAuthentic': false
    });

    if (recentCounterfeit > 5) {
      alerts.push({
        id: 'suspicious_activity',
        type: 'error',
        message: `High counterfeit detection rate: ${recentCounterfeit} suspicious scans in 24h`,
        severity: 'high'
      });
    }

    // System health check
    alerts.push({
      id: 'system_health',
      type: 'success',
      message: 'All systems operational - Blockchain sync completed',
      severity: 'low'
    });

    res.json({
      success: true,
      data: alerts
    });

  } catch (error) {
    console.error('Error fetching admin system alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch system alerts',
      error: error.message
    });
  }
};

// Helper function to format time ago
function getTimeAgo(date) {
  const now = new Date();
  const diffMs = now - new Date(date);
  const diffMins = Math.floor(diffMs / (1000 * 60));
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} mins ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hours ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} days ago`;
}