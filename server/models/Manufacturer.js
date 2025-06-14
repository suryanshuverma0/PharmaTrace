const mongoose = require('mongoose');

const manufacturerSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },

  companyName: { type: String },
  registrationNumber: { type: String },
  licenseDocument: { type: String }, 
  manufacturingUnits: [String],
  country: String,
  state: String,
  city: String,
  website: String,
  email: String,
  contactNumber: String,

  certifications: [String],
  productTypes: [String], 
}, {
  timestamps: true
});

module.exports = mongoose.model('Manufacturer', manufacturerSchema);
