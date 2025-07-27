const mongoose = require('mongoose');

const verificationLogSchema = new mongoose.Schema({
  productId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product',
    required: true 
  },
  batchId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Batch',
    required: true 
  },
  verifiedBy: {
    deviceId: String,
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userType: String
  },
  verificationDate: {
    type: Date,
    default: Date.now
  },
  location: {
    latitude: Number,
    longitude: Number,
    address: String
  },
  result: {
    isAuthentic: Boolean,
    status: {
      type: String,
      enum: ['Valid', 'Invalid', 'Suspicious', 'Expired']
    },
    details: String
  },
  deviceInfo: {
    type: String
  }
});

module.exports = mongoose.model('VerificationLog', verificationLogSchema);
