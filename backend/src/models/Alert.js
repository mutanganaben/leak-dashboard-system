const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  nodeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Node',
    required: true,
    index: true
  },
  pressure: {
    type: Number,
    required: true
  },
  nodeName: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    trim: true
  },
  utilization: {
    type: Number,
    min: 0
  },
  level: {
    type: String,
    enum: ["caution", "warning"],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  acknowledged: {
    type: Boolean,
    default: false
  },
  acknowledgedAt: {
    type: Date
  },
  resolvedAt: {
    type: Date
  },
  autoAcknowledged: {
    type: Boolean,
    default: false
  },
  notificationChannels: {
    email: { type: Boolean, default: false },
    sms: { type: Boolean, default: false },
    push: { type: Boolean, default: false }
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

module.exports = mongoose.model('Alert', alertSchema);
