// models/Product.js
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch' },
  manufacturerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  productName: String,
  serialNumber: String,
  batchNumber: String,
  manufactureDate: Date,
  expiryDate: Date,
  price: Number,
  manufacturerName: String,
  manufacturerLicense: String,

  productionLocation: String,
  drugCode: String,
  dosageForm: String,
  strength: String,
  storageCondition: String,
  approvalCertId: String,
  manufacturerCountry: String,
  fingerprint: String,
  qrCodeUrl: String,

  // Additional fields for product verification
  packSize: String,
  regulatoryInfo: {
    licenseNumber: String,
    issuedBy: String,
    issuedDate: Date,
    validUntil: Date
  },
  verificationStatus: {
    type: String,
    enum: ['Verified', 'Unverified', 'Suspicious'],
    default: 'Unverified'
  },
  composition: [{
    ingredient: String,
    quantity: String
  }],
  usage: {
    indications: [String],
    contraindications: [String],
    sideEffects: [String],
    dosage: String
  },

  // Blockchain fields
  txHash: String,
  blockNumber: Number,
  blockHash: String,
  gasUsed: String,
  contractAddress: String,
  manufacturerAddress: String,
  
  isAuthentic: {
    type: Boolean,
    default: false
  },
  verifiedAt: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update timestamp on save
productSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Product', productSchema);

