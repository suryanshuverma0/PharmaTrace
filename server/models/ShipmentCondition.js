const mongoose = require('mongoose');

const shipmentConditionSchema = new mongoose.Schema({
  batchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  temperature: {
    value: Number,
    unit: {
      type: String,
      default: '°C'
    },
    status: {
      type: String,
      enum: ['Normal', 'Warning', 'Critical']
    }
  },
  humidity: {
    value: Number,
    unit: {
      type: String,
      default: '%'
    },
    status: {
      type: String,
      enum: ['Normal', 'Warning', 'Critical']
    }
  },
  location: {
    type: {
      latitude: Number,
      longitude: Number,
      address: String
    }
  },
  handledBy: {
    type: String,
    required: true
  },
  stage: {
    type: String,
    enum: ['Manufacturing', 'Distribution', 'Storage', 'Pharmacy'],
    required: true
  },
  remarks: String
});

module.exports = mongoose.model('ShipmentCondition', shipmentConditionSchema);
