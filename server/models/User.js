const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  address: { type: String, required: true, unique: true },
  name: String,
  username: String,
  email: String,
  phone: String,
  role: {
    type: String,
    enum: ['consumer', 'pharmacist', 'distributor', 'manufacturer'],
    default: 'consumer'
  },
  isApproved: { type: Boolean, default: false },
  isActive: { type: Boolean, default: false },
  chain: String,
  networkId: Number,
  publicKey: String,
  nonce: String,
  permissions: [String],
  lastLogin: Date,
}, {
  timestamps: true  
});

module.exports = mongoose.model('User', userSchema);
