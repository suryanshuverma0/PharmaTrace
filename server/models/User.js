const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  address: { type: String, required: true, unique: true },
  name: String,
  username: String,
  email: String,
  phone: String,
  role: {
    type: String,
    enum: ['consumer', 'pharmacist', 'distributor', 'manufacturer', 'superadmin'],
    default: 'consumer'
  },
  country: { type: String, required: true },
  state: { type: String },
  city: { type: String },
  workingRegions: { type: [String], default: [] }, // Array of district names for manufacturers, distributors, pharmacists
  website: String,
  isApproved: { type: Boolean, default: false },
  isActive: { type: Boolean, default: false },
  chain: String,
  networkId: Number,
  publicKey: String,
  nonce: String,
  permissions: [String],
  txHash: String,
  lastLogin: Date,
}, {
  timestamps: true  
});

module.exports = mongoose.model('User', userSchema);
