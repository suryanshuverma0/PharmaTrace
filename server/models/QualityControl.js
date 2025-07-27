const mongoose = require('mongoose');

const qualityControlSchema = new mongoose.Schema({
  batchId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Batch',
    required: true 
  },
  testDate: {
    type: Date,
    required: true
  },
  testedBy: {
    type: String,
    required: true
  },
  parameters: [{
    name: {
      type: String,
      required: true
    },
    value: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['Pass', 'Fail', 'Warning'],
      required: true
    }
  }],
  overallResult: {
    type: String,
    enum: ['Pass', 'Fail'],
    required: true
  },
  remarks: String,
  documents: [{
    name: String,
    url: String,
    type: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('QualityControl', qualityControlSchema);
