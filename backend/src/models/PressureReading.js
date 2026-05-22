const mongoose = require('mongoose');

const pressureReadingSchema = new mongoose.Schema({
  nodeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Node',
    required: true,
    index: true
  },
  pressure: {
    type: Number,
    required: true,
    min: 0
  },
  source: {
    type: String,
    enum: ['simulation', 'manual', 'iot'],
    default: 'simulation',
    index: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
});

module.exports = mongoose.model('PressureReading', pressureReadingSchema);
