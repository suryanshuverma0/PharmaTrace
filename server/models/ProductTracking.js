const mongoose = require('mongoose');

const productTrackingSchema = new mongoose.Schema({
  // Core tracking information
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  
  manufacturerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Product identification
  serialNumber: {
    type: String,
    required: true,
    index: true
  },
  
  productName: {
    type: String
  },
  
  // Tracking event details
  trackingType: {
    type: String,
    enum: ['qr_scan', 'manual_verification', 'serial_lookup'],
    required: true,
    default: 'manual_verification'
  },
  
  verificationResult: {
    isAuthentic: { type: Boolean, required: true },
    status: {
      type: String,
      enum: ['verified', 'counterfeit', 'suspicious', 'not_found', 'error', 'expired'],
      required: true
    },
    isExpired: { type: Boolean, default: false }
  },
  
  // Location tracking
  location: {
    country: { type: String },
    city: { type: String },
    latitude: { type: Number },
    longitude: { type: Number },
    accuracy: { type: Number },
    ipAddress: { type: String }
  },
  
  // Device information
  deviceInfo: {
    deviceType: {
      type: String,
      enum: ['mobile', 'tablet', 'desktop', 'unknown'],
      default: 'unknown'
    },
    browser: { type: String },
    platform: { type: String },
    screenWidth: { type: Number },
    screenHeight: { type: Number }
  },
  
  // Scan method information
  scanMethod: {
    type: String,
    enum: ['camera_scan', 'image_upload', 'manual_entry'],
    required: true,
    default: 'manual_entry'
  },
  
  // Essential timestamps
  scannedAt: { type: Date, default: Date.now, required: true },
  locationTimestamp: { type: Date }
}, {
  timestamps: true,
  collection: 'product_trackings'
});

// Essential indexes for performance
productTrackingSchema.index({ manufacturerId: 1, scannedAt: -1 });
productTrackingSchema.index({ serialNumber: 1, scannedAt: -1 });
productTrackingSchema.index({ 'location.country': 1, scannedAt: -1 });
productTrackingSchema.index({ 'verificationResult.status': 1, scannedAt: -1 });

// Compound index for manufacturer analytics
productTrackingSchema.index({ 
  manufacturerId: 1, 
  'location.country': 1, 
  scannedAt: -1 
});

// Static methods for manufacturer analytics
productTrackingSchema.statics.getManufacturerAnalytics = function(manufacturerId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        manufacturerId: new mongoose.Types.ObjectId(manufacturerId),
        scannedAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: null,
        totalScans: { $sum: 1 },
        uniqueProducts: { $addToSet: '$serialNumber' },
        countries: { $addToSet: '$location.country' },
        authenticScans: {
          $sum: { $cond: ['$verificationResult.isAuthentic', 1, 0] }
        },
        counterfeitDetections: {
          $sum: { $cond: [{ $eq: ['$verificationResult.status', 'counterfeit'] }, 1, 0] }
        },
        expiredProducts: {
          $sum: { $cond: ['$verificationResult.isExpired', 1, 0] }
        }
      }
    }
  ]);
};

productTrackingSchema.statics.getLocationHeatmap = function(manufacturerId) {
  return this.aggregate([
    { $match: { manufacturerId: new mongoose.Types.ObjectId(manufacturerId) } },
    {
      $group: {
        _id: {
          country: '$location.country',
          city: '$location.city'
        },
        scanCount: { $sum: 1 },
        lastScan: { $max: '$scannedAt' }
      }
    },
    { $sort: { scanCount: -1 } }
  ]);
};

// Post-save middleware for alerts
productTrackingSchema.post('save', async function(doc) {
  // Log verification events
  console.log(`📍 Product verification logged: ${doc.serialNumber} - Status: ${doc.verificationResult.status}`);
  
  // Trigger alerts for specific events
  if (doc.verificationResult.status === 'counterfeit') {
    console.log(`🚨 COUNTERFEIT ALERT: ${doc.serialNumber} detected at ${doc.location.country || 'Unknown'}`);
  }
  
  if (doc.verificationResult.status === 'expired') {
    console.log(`⚠️ EXPIRED PRODUCT: ${doc.serialNumber} scanned at ${doc.location.country || 'Unknown'}`);
  }
  
  if (doc.verificationResult.status === 'not_found') {
    console.log(`❓ UNKNOWN PRODUCT: ${doc.serialNumber} - Invalid serial number attempt`);
  }
});

module.exports = mongoose.model('ProductTracking', productTrackingSchema);