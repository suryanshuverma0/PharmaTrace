const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema({
  manufacturerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', 
    required: true,
  },

  batchNumber: {
    type: String,
    required: true,
    unique: true,  // unique per batch
  },

  manufactureDate: {
    type: Date,
    required: true,
  },

  expiryDate: {
    type: Date,
    required: true,
  },

  quantityProduced: {
    type: Number,
    required: true,
    min: 0,
  },

  quantityAvailable: {
    type: Number,
    default: function () {
      return this.quantityProduced;
    },
    min: 0,
    description: 'Quantity available for individual product registration'
  },

  quantityAssigned: {
    type: Number,
    default: 0,
    min: 0,
    description: 'Total quantity assigned to distributors in batches'
  },

  // Virtual field to calculate remaining quantity for assignment
  quantityRemaining: {
    type: Number,
    default: function() {
      return this.quantityProduced - this.quantityAssigned;
    },
    min: 0,
    description: 'Quantity remaining for batch assignment to distributors'
  },

  productName: {
    type: String,
    required: true,
    trim: true,
    description: 'Name of the pharmaceutical product (e.g., Paracetamol 500mg Tablets)'
  },

  dosageForm: {
    type: String,
    required: true,
    trim: true,
  },

  strength: {
    type: String,
    required: true,
    trim: true,
  },

  storageConditions: {
    type: String,
    default: '',
  },

  productionLocation: {
    type: String,
    default: '',
  },

  approvalCertId: {
    type: String,
    default: '',
  },

  digitalFingerprint: {
    type: String,
  },

  // Blockchain-related fields
  txHash: {
    type: String,
    // index: true, // Removed to avoid duplicate index warning - defined separately below
  },

  blockNumber: {
    type: Number,
    // index: true, // Removed to avoid duplicate index warning - defined separately below
  },

  blockHash: {
    type: String,
  },

  gasUsed: {
    type: String, // Store as string to handle large numbers
  },

  contractAddress: {
    type: String,
  },

  manufacturerAddress: {
    type: String, // Blockchain address of manufacturer
  },

  // Shipment tracking
  shipmentStatus: {
    type: String,
    enum: ['Produced', 'In Transit', 'Delivered', 'Returned', 'Recalled'],
    default: 'Produced',
  },

  shipmentHistory: [
    {
      timestamp: { type: Date, default: Date.now },
      from: { type: String, required: true },
      to: { type: String, required: true },
  // Addresses (wallets) for more precise matching
  fromAddress: { type: String },
  toAddress: { type: String },
      status: { type: String, required: true },
      quantity: { type: String, required: true },
      remarks: String,
      txHash: String,
      // Additional fields for journey tracking
      actor: {
        name: { type: String, required: true },
        type: { type: String, required: true },
        license: { type: String },
        location: { type: String }
      },
      environmentalConditions: {
        temperature: String,
        humidity: String,
        status: {
          type: String,
          enum: ['Normal', 'Warning', 'Critical']
        }
      },
      qualityCheck: {
        performedBy: String,
        date: Date,
        result: {
          type: String,
          enum: ['Pass', 'Fail', 'Pending']
        },
        notes: String
      },
      verifiedBy: {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        timestamp: Date,
        role: String
      }
    }
  ],

  // Blockchain verification status
  blockchainVerified: {
    type: Boolean,
    default: false,
  },

  // Last blockchain sync timestamp
  lastBlockchainSync: {
    type: Date,
    default: Date.now,
  },

  // Auto product generation
  autoGenerateProducts: {
    type: Boolean,
    default: true
  },
  maxAutoGenerateQuantity: {
    type: Number,
    default: 6,
    min: 1,
    max: 50
  },
  productGenerationStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed'],
    default: 'pending'
  },

  // Verification flags for supply chain actors
  manufacturerVerified: {
    type: Boolean,
    default: true, // Auto-verified when manufacturer registers batch
    description: 'Verification status by manufacturer'
  },
  distributorVerified: {
    type: Boolean,
    default: false,
    description: 'Verification status by distributor when acknowledging shipment'
  },
  pharmacistVerified: {
    type: Boolean,
    default: false,
    description: 'Verification status by pharmacist when confirming receipt'
  },
  verificationTimestamps: {
    manufacturerVerifiedAt: {
      type: Date,
      default: Date.now // Set when batch is created
    },
    distributorVerifiedAt: Date,
    pharmacistVerifiedAt: Date
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },

  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexes for better query performance
batchSchema.index({ manufacturerId: 1, batchNumber: 1 });
batchSchema.index({ txHash: 1 });
batchSchema.index({ blockNumber: 1 });
batchSchema.index({ manufacturerAddress: 1 });

// Middleware to update `updatedAt` on save
batchSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  
  // Set blockchain verification status
  if (this.txHash && this.blockNumber) {
    this.blockchainVerified = true;
    this.lastBlockchainSync = new Date();
  }
  
  next();
});

// Virtual for blockchain verification status
batchSchema.virtual('isOnBlockchain').get(function() {
  return !!(this.txHash && this.blockNumber);
});

// Virtual for remaining quantity calculation
batchSchema.virtual('quantityRemainingForAssignment').get(function() {
  return Math.max(0, (this.quantityProduced || 0) - (this.quantityAssigned || 0));
});

// Virtual for total products registered
batchSchema.virtual('totalProductsRegistered').get(function() {
  return (this.quantityProduced || 0) - (this.quantityAvailable || 0);
});

// Method to sync with blockchain
batchSchema.methods.syncWithBlockchain = async function() {
  // This method can be used to verify batch data against blockchain
  // Implementation would depend on your specific blockchain setup
  this.lastBlockchainSync = new Date();
  return this.save();
};

// Method to register a product (reduces quantityAvailable)
batchSchema.methods.registerProduct = async function(quantity = 1) {
  if (this.quantityAvailable < quantity) {
    throw new Error('Insufficient quantity available for product registration');
  }
  this.quantityAvailable -= quantity;
  return this.save();
};

// Method to assign quantity to distributor (increases quantityAssigned)
batchSchema.methods.assignToDistributor = async function(quantity) {
  const remaining = (this.quantityProduced || 0) - (this.quantityAssigned || 0);
  if (remaining < quantity) {
    throw new Error(`Cannot assign ${quantity} units. Only ${remaining} units remaining for assignment`);
  }
  this.quantityAssigned = (this.quantityAssigned || 0) + quantity;
  return this.save();
};

// Method to unassign quantity (decreases quantityAssigned) - for cancellations
batchSchema.methods.unassignFromDistributor = async function(quantity) {
  if ((this.quantityAssigned || 0) < quantity) {
    throw new Error('Cannot unassign more than currently assigned');
  }
  this.quantityAssigned = Math.max(0, (this.quantityAssigned || 0) - quantity);
  return this.save();
};

// Static method to find batches by manufacturer address
batchSchema.statics.findByManufacturerAddress = function(address) {
  return this.find({ manufacturerAddress: address });
};

// Static method to find unverified batches
batchSchema.statics.findUnverified = function() {
  return this.find({ blockchainVerified: false });
};

module.exports = mongoose.model('Batch', batchSchema);