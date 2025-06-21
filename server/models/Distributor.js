const mongoose = require('mongoose');

const distributorSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  companyName: { type: String, required: true },
  registrationNumber: { type: String, required: true },
  licenseDocument: { type: String },
  warehouseAddress: { type: String, required: true },
  operationalRegions: [String],

}, {
  timestamps: true
});

module.exports = mongoose.model('Distributor', distributorSchema);
