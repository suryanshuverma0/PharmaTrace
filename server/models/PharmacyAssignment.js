const mongoose = require('mongoose');

const pharmacyAssignmentSchema = new mongoose.Schema({
  batchAssignmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BatchAssignment',
    required: true
  },
  batchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    required: true
  },
  distributorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Distributor',
    required: true
  },
  pharmacistId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pharmacist',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  assignedProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  status: {
    type: String,
    enum: ['assigned', 'shipped', 'in_transit', 'delivered', 'cancelled'],
    default: 'assigned'
  },
  shipmentStatus: {
    type: String,
    enum: ['Assigned', 'Processing', 'Shipped', 'In Transit', 'Delivered', 'Cancelled'],
    default: 'Assigned'
  },
  pharmacy: {
    name: String,
    location: String,
    license: String,
    contact: {
      name: String,
      email: String,
      phone: String
    }
  },
  assignedAt: {
    type: Date,
    default: Date.now
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  remarks: String,
  shipmentDetails: {
    trackingNumber: String,
    carrier: String,
    estimatedDelivery: Date,
    actualDelivery: Date,
    origin: {
      address: String,
      location: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], default: [0, 0] }
      }
    },
    destination: {
      address: String,
      location: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], default: [0, 0] }
      }
    }
  },
  tracking: [{
    status: String,
    location: String,
    timestamp: Date,
    description: String,
    updatedBy: {
      id: mongoose.Schema.Types.ObjectId,
      role: String
    },
    environmentalConditions: {
      temperature: {
        value: Number,
        unit: String,
        status: String
      },
      humidity: {
        value: Number,
        unit: String,
        status: String
      }
    }
  }],
  documents: [{
    type: {
      type: String,
      enum: ['invoice', 'packingSlip', 'shippingLabel', 'qualityCertificate', 'other']
    },
    url: String,
    uploadedAt: Date,
    uploadedBy: {
      id: mongoose.Schema.Types.ObjectId,
      role: String
    }
  }]
}, {
  timestamps: true
});

// Indexes for efficient querying
pharmacyAssignmentSchema.index({ distributorId: 1, assignedAt: -1 });
pharmacyAssignmentSchema.index({ pharmacistId: 1, status: 1 });
pharmacyAssignmentSchema.index({ batchId: 1 });
pharmacyAssignmentSchema.index({ 'shipmentDetails.trackingNumber': 1 });

// Update lastUpdated on save
pharmacyAssignmentSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

module.exports = mongoose.model('PharmacyAssignment', pharmacyAssignmentSchema);
