const mongoose = require('mongoose');

const batchAssignmentSchema = new mongoose.Schema({
  batchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    required: true
  },
  batchNumber: {
    type: String,
    required: true
  },
  manufacturerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Manufacturer',
    required: true
  },
  distributorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Distributor',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  productIds: [{
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
  distributor: {
    name: String,
    address: String,
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
  }],
  qualityChecks: [{
    checkType: String,
    status: String,
    checkedAt: Date,
    checkedBy: {
      id: mongoose.Schema.Types.ObjectId,
      role: String
    },
    notes: String,
    attachments: [{
      url: String,
      type: String
    }]
  }],
  temperature: [{
    value: Number,
    unit: String,
    timestamp: Date,
    location: String
  }]
});

// Add indexes for common queries
batchAssignmentSchema.index({ manufacturerId: 1, assignedAt: -1 });
batchAssignmentSchema.index({ distributorId: 1, status: 1 });
batchAssignmentSchema.index({ batchNumber: 1 });
batchAssignmentSchema.index({ 'shipmentDetails.trackingNumber': 1 });
batchAssignmentSchema.index({ 'distributor.license': 1 });

// Add spatial index for location tracking
batchAssignmentSchema.index({ 'shipmentDetails.origin.location': '2dsphere' });
batchAssignmentSchema.index({ 'shipmentDetails.destination.location': '2dsphere' });

// Create a compound index for tracking lookups
batchAssignmentSchema.index({ batchNumber: 1, status: 1, 'shipmentDetails.trackingNumber': 1 });

// Add middleware to update lastUpdated timestamp
batchAssignmentSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

// Add methods for tracking updates
batchAssignmentSchema.methods.addTrackingUpdate = async function(update) {
  this.tracking.push({
    ...update,
    timestamp: new Date()
  });
  return this.save();
};

batchAssignmentSchema.methods.updateShipmentStatus = async function(status, location, description, updatedBy) {
  this.shipmentStatus = status;
  this.tracking.push({
    status,
    location,
    timestamp: new Date(),
    description,
    updatedBy
  });
  return this.save();
};

const BatchAssignment = mongoose.model('BatchAssignment', batchAssignmentSchema);

module.exports = BatchAssignment;
