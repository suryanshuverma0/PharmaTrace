// models/Product.js
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  productName: String,
  serialNumber: String,
  batchNumber: String,
  manufactureDate: Date,
  expiryDate: Date,
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
  manufacturerAddress: String,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Product', productSchema);

