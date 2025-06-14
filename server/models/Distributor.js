const mongoose = require('mongoose');

const distributorSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },

  companyName: { type: String, required: true },
  registrationNumber: { type: String, required: true },
  licenseDocument: { type: String },
  warehouseAddress: { type: String, required: true },
  operationalRegions: [String],
  country: String,
  state: String,
  city: String,
  website: String,
  email: String,
  contactPerson: String,
  phone: String,

  transportModes: [String],
  storageCapacity: String,
  coldStorageAvailable: { type: Boolean, default: false },
  deliveryPartners: [String],

  isApproved: { type: Boolean, default: false },
}, {
  timestamps: true
});

module.exports = mongoose.model('Distributor', distributorSchema);
