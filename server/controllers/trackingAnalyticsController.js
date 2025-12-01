const ProductTracking = require('../models/ProductTracking');
const Product = require('../models/Product');
const Manufacturer = require('../models/Manufacturer');
const mongoose = require('mongoose');

// Simple reverse geocoding function using a free API
async function reverseGeocode(latitude, longitude) {
  try {
    const response = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
    );
    
    if (!response.ok) {
      throw new Error('Geocoding API error');
    }
    
    const data = await response.json();

    // Extract district from administrative array
    const districtObj = data.localityInfo?.administrative?.find(adm => adm.adminLevel === 6);
    const district = districtObj ? districtObj.name : null;

    return {
      country: data.countryName || null,
      province: data.principalSubdivision || null,
      district: district,       // <-- added district
      city: data.city || data.locality || null,
      countryCode: data.countryCode || null
    };
  } catch (error) {
    console.log('Reverse geocoding failed:', error.message);
    return {
      country: null,
      province: null,
      district: null,
      city: null,
      countryCode: null
    };
  }
}

// Get manufacturer verification analytics
exports.getManufacturerAnalytics = async (req, res) => {
  try {
    const userId = req.user.userId;

    console.log('Fetching analytics for user:', userId);

    // Find the manufacturer record for this user
    const manufacturer = await Manufacturer.findOne({ user: userId });
    if (!manufacturer) {
      return res.status(404).json({
        success: false,
        message: 'Manufacturer not found'
      });
    }

    // Convert userId to ObjectId for proper matching
    const userObjectId = new mongoose.Types.ObjectId(userId);
    
    // Debug: Check if we have any tracking records for this user
    const debugCount = await ProductTracking.countDocuments({ manufacturerId: userObjectId });
    console.log(`Debug: Found ${debugCount} tracking records for manufacturer ${userId}`);

    const { startDate, endDate, timeRange = '7d' } = req.query;

    // Calculate date range
    let dateFilter = {};
    const now = new Date();
    
    if (startDate && endDate) {
      dateFilter.scannedAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else {
      // Default time ranges
      const ranges = {
        '24h': new Date(now.getTime() - 24 * 60 * 60 * 1000),
        '7d': new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        '30d': new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        '90d': new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
      };
      
      dateFilter.scannedAt = { $gte: ranges[timeRange] || ranges['7d'] };
    }

    // Get comprehensive analytics
    const analytics = await ProductTracking.aggregate([
      {
        $match: {
          manufacturerId: userObjectId,
          ...dateFilter
        }
      },
      {
        $facet: {
          // Overall statistics
          overview: [
            {
              $group: {
                _id: null,
                totalScans: { $sum: 1 },
                uniqueProducts: { $addToSet: '$serialNumber' },
                countries: { $addToSet: '$location.country' },
                authenticScans: {
                  $sum: { $cond: ['$verificationResult.isAuthentic', 1, 0] }
                },
                expiredScans: {
                  $sum: { $cond: ['$verificationResult.isExpired', 1, 0] }
                },
                counterfeitDetections: {
                  $sum: { $cond: [{ $eq: ['$verificationResult.status', 'counterfeit'] }, 1, 0] }
                },
                suspiciousScans: {
                  $sum: { $cond: [{ $eq: ['$verificationResult.status', 'suspicious'] }, 1, 0] }
                },
                notFoundAttempts: {
                  $sum: { $cond: [{ $eq: ['$verificationResult.status', 'not_found'] }, 1, 0] }
                }
              }
            },
            {
              $project: {
                _id: 0,
                totalScans: 1,
                uniqueProductCount: { $size: '$uniqueProducts' },
                uniqueCountries: { $size: '$countries' },
                authenticScans: 1,
                expiredScans: 1,
                counterfeitDetections: 1,
                suspiciousScans: 1,
                notFoundAttempts: 1,
                authenticationRate: {
                  $cond: [
                    { $gt: ['$totalScans', 0] },
                    { $multiply: [{ $divide: ['$authenticScans', '$totalScans'] }, 100] },
                    0
                  ]
                }
              }
            }
          ],

          // Location heatmap data
          locationData: [
            {
              $match: {
                'location.latitude': { $exists: true, $ne: null },
                'location.longitude': { $exists: true, $ne: null }
              }
            },
            {
              $group: {
                _id: {
                  lat: '$location.latitude',
                  lng: '$location.longitude',
                  country: '$location.country',
                  city: '$location.city'
                },
                scanCount: { $sum: 1 },
                lastScan: { $max: '$scannedAt' },
                products: { $addToSet: '$serialNumber' },
                statusBreakdown: {
                  $push: '$verificationResult.status'
                }
              }
            },
            {
              $project: {
                _id: 0,
                latitude: '$_id.lat',
                longitude: '$_id.lng',
                country: '$_id.country',
                city: '$_id.city',
                scanCount: 1,
                lastScan: 1,
                uniqueProducts: { $size: '$products' },
                statusBreakdown: 1
              }
            },
            { $sort: { scanCount: -1 } }
          ],

          // Time series data for charts
          timeSeriesData: [
            {
              $group: {
                _id: {
                  date: {
                    $dateToString: {
                      format: '%Y-%m-%d',
                      date: '$scannedAt'
                    }
                  }
                },
                scans: { $sum: 1 },
                authentic: {
                  $sum: { $cond: ['$verificationResult.isAuthentic', 1, 0] }
                },
                counterfeit: {
                  $sum: { $cond: [{ $eq: ['$verificationResult.status', 'counterfeit'] }, 1, 0] }
                },
                expired: {
                  $sum: { $cond: ['$verificationResult.isExpired', 1, 0] }
                }
              }
            },
            { $sort: { '_id.date': 1 } }
          ],

          // Device and platform analytics
          deviceAnalytics: [
            {
              $group: {
                _id: '$deviceInfo.deviceType',
                count: { $sum: 1 }
              }
            },
            { $sort: { count: -1 } }
          ],

          // Product popularity
          productAnalytics: [
            {
              $group: {
                _id: {
                  serialNumber: '$serialNumber',
                  productName: '$productName'
                },
                scanCount: { $sum: 1 },
                lastScanned: { $max: '$scannedAt' },
                countries: { $addToSet: '$location.country' }
              }
            },
            {
              $project: {
                _id: 0,
                serialNumber: '$_id.serialNumber',
                productName: '$_id.productName',
                scanCount: 1,
                lastScanned: 1,
                globalReach: { $size: '$countries' }
              }
            },
            { $sort: { scanCount: -1 } },
            { $limit: 10 }
          ]
        }
      }
    ]);

    const result = analytics[0];

    res.json({
      success: true,
      data: {
        overview: result.overview[0] || {
          totalScans: 0,
          uniqueProductCount: 0,
          uniqueCountries: 0,
          authenticScans: 0,
          expiredScans: 0,
          counterfeitDetections: 0,
          suspiciousScans: 0,
          notFoundAttempts: 0,
          authenticationRate: 0
        },
        locationData: result.locationData,
        timeSeriesData: result.timeSeriesData,
        deviceAnalytics: result.deviceAnalytics,
        productAnalytics: result.productAnalytics,
        generatedAt: new Date()
      }
    });

  } catch (error) {
    console.error('Error getting manufacturer analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get analytics data',
      error: error.message
    });
  }
};

// Get real-time verification events
exports.getRealtimeVerifications = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { limit = 10 } = req.query;

    // Convert userId to ObjectId for proper matching
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Get recent verifications for this manufacturer
    const recentVerifications = await ProductTracking.find({
      manufacturerId: userObjectId
    })
    .sort({ scannedAt: -1 })
    .limit(parseInt(limit))
    .select({
      serialNumber: 1,
      productName: 1,
      'verificationResult.status': 1,
      'verificationResult.isAuthentic': 1,
      'verificationResult.isExpired': 1,
      'location.country': 1,
      'location.city': 1,
      'location.latitude': 1,
      'location.longitude': 1,
      'deviceInfo.deviceType': 1,
      scanMethod: 1,
      scannedAt: 1
    });

    res.json({
      success: true,
      data: recentVerifications
    });

  } catch (error) {
    console.error('Error getting realtime verifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get realtime data',
      error: error.message
    });
  }
};

// Get location details with reverse geocoding info
exports.getLocationDetails = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Convert userId to ObjectId for proper matching
    const userObjectId = new mongoose.Types.ObjectId(userId);
    
    // Debug: Check if we have any records with location data
    const debugLocationCount = await ProductTracking.countDocuments({ 
      manufacturerId: userObjectId,
      'location.latitude': { $exists: true, $ne: null },
      'location.longitude': { $exists: true, $ne: null }
    });
    console.log(`Debug: Found ${debugLocationCount} records with location data for manufacturer ${userId}`);
    
    const locationStats = await ProductTracking.aggregate([
      {
        $match: {
          manufacturerId: userObjectId,
          'location.latitude': { $exists: true, $ne: null },
          'location.longitude': { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: {
            // Group by rounded coordinates to cluster nearby locations (within ~100m)
            lat: { $round: [{ $multiply: ['$location.latitude', 1000] }, 0] },
            lng: { $round: [{ $multiply: ['$location.longitude', 1000] }, 0] }
          },
          coordinates: {
            $first: {
              latitude: '$location.latitude',
              longitude: '$location.longitude'
            }
          },
          verifications: { $sum: 1 },
          products: { $addToSet: '$serialNumber' },
          lastVerification: { $max: '$scannedAt' },
          deviceTypes: { $addToSet: '$deviceInfo.deviceType' },
          verificationStatus: { $addToSet: '$verificationResult.status' },
          statusCounts: { $push: '$verificationResult.status' }
        }
      },
      {
        $project: {
          _id: 0,
          coordinates: '$coordinates',
          stats: {
            totalVerifications: '$verifications',
            uniqueProducts: { $size: '$products' },
            lastVerification: '$lastVerification',
            deviceBreakdown: { $filter: { input: '$deviceTypes', as: 'device', cond: { $ne: ['$$device', null] } } },
            statusBreakdown: { $filter: { input: '$verificationStatus', as: 'status', cond: { $ne: ['$$status', null] } } },
            statusCounts: '$statusCounts'
          }
        }
      },
      { $sort: { 'stats.totalVerifications': -1 } },
      { $limit: 50 }
    ]);

    // Add reverse geocoding to get location names
    const locationDataWithNames = await Promise.all(
      locationStats.map(async (location) => {
        const geocodeData = await reverseGeocode(
          location.coordinates.latitude,
          location.coordinates.longitude
        );

        return {
          location: {
            coordinates: location.coordinates,
            country: geocodeData.country,
            city: geocodeData.city,
            region: geocodeData.region,
            district: geocodeData.district,
            countryCode: geocodeData.countryCode
          },
          stats: {
            ...location.stats,
            // Count occurrences of each status
            statusCounts: location.stats.statusCounts.reduce((acc, status) => {
              acc[status] = (acc[status] || 0) + 1;
              return acc;
            }, {})
          }
        };
      })
    );

    console.log(`✅ Location details retrieved: ${locationDataWithNames.length} locations with geocoding`);

    res.json({
      success: true,
      data: locationDataWithNames
    });

  } catch (error) {
    console.error('Error getting location details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get location details',
      error: error.message
    });
  }
};