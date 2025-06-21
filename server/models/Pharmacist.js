const mongoose = require('mongoose');


const pharmacistSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  pharmacyName: { type: String, required: true },
  licenseNumber: { type: String, required: true },
  licenseDocument: { type: String },
  pharmacyLocation: { type: String },
}, {
  timestamps: true
});


module.exports = mongoose.model('Pharmacist', pharmacistSchema);

