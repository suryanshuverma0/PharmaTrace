const mongoose = require('mongoose');

const manufacturerSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  companyName: { type: String },
  registrationNumber: { type: String },
  licenseDocument: { type: String }, 
  certifications: [String],
}, {
  timestamps: true
});

module.exports = mongoose.model('Manufacturer', manufacturerSchema);
