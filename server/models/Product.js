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

  txHash: String,
  blockNumber:Number,
  blockHash:String,
  gasUsed:String,
  contractAddress:String,

  manufacturerAddress: String,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Product', productSchema);

