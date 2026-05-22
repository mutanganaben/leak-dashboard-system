const mongoose = require('mongoose');

const nodeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Node name is required'],
    trim: true,
    maxlength: [50, 'Node name cannot exceed 50 characters']
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true,
    index: true
  },
  deviceId: {
    type: String,
    required: [true, 'Simulation Node ID is required'],
    unique: true,
    trim: true,
    lowercase: true,
    maxlength: [80, 'Simulation Node ID cannot exceed 80 characters']
  },
  maop: {
    type: Number,
    required: [true, 'MAOP is required'],
    min: [0, 'MAOP must be positive']
  },
  pipeAge: {
    type: Number,
    required: [true, 'Pipe age is required'],
    min: [0, 'Pipe age cannot be negative']
  },
  latitude: {
    type: Number,
    required: [true, 'Latitude is required'],
    min: -90,
    max: 90
  },
  longitude: {
    type: Number,
    required: [true, 'Longitude is required'],
    min: -180,
    max: 180
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

nodeSchema.pre('validate', function assignDeviceId() {
  if (!this.deviceId && this._id) {
    this.deviceId = `sim-${this._id.toString()}`;
  }
});

module.exports = mongoose.model('Node', nodeSchema);
