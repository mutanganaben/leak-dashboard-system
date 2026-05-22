const Node = require('../models/Node');
const PressureReading = require('../models/PressureReading');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../middleware/errorResponse');
const { evaluateNodeReading } = require('./alertController');

const createReadingForNode = async (node, pressure, timestamp, source = 'simulation') => {
  const reading = await PressureReading.create({
    nodeId: node._id,
    pressure,
    source,
    ...(timestamp ? { timestamp } : {})
  });

  const alertEvaluation = await evaluateNodeReading(node, pressure);

  return { reading, alertEvaluation };
};

const generateSimulatedPressure = (node) => {
  const maop = Number(node.maop) || 100;
  const ageFactor = Math.min((Number(node.pipeAge) || 0) / 50, 0.3);
  const baseline = maop * (0.48 + Math.random() * 0.18 + ageFactor);
  const fluctuation = (Math.random() - 0.5) * maop * 0.16;
  const leakSpike = Math.random() < 0.12 ? maop * (0.2 + Math.random() * 0.25) : 0;
  const pressure = Math.max(0, baseline + fluctuation + leakSpike);

  return parseFloat(pressure.toFixed(2));
};

// @desc    Ingest a pressure reading for a node
// @route   POST /api/readings
// @access  Private
const createPressureReading = asyncHandler(async (req, res, next) => {
  const { nodeId, pressure, timestamp, source = 'simulation' } = req.body;
  const deviceId = req.body.deviceId ? String(req.body.deviceId).trim().toLowerCase() : undefined;

  if (!nodeId && !deviceId) {
    return next(new ErrorResponse('nodeId or simulation node ID is required', 400));
  }

  const parsedPressure = Number(pressure);
  if (!Number.isFinite(parsedPressure) || parsedPressure < 0) {
    return next(new ErrorResponse('pressure must be a valid non-negative number', 400));
  }

  const node = nodeId ? await Node.findById(nodeId) : await Node.findOne({ deviceId });
  if (!node) {
    return next(new ErrorResponse(nodeId ? `Node not found with id of ${nodeId}` : `Node not found with simulation node ID of ${deviceId}`, 404));
  }

  let readingTimestamp;
  if (timestamp !== undefined) {
    readingTimestamp = new Date(timestamp);
    if (Number.isNaN(readingTimestamp.getTime())) {
      return next(new ErrorResponse('timestamp must be a valid date', 400));
    }
  }

  const { reading, alertEvaluation } = await createReadingForNode(
    node,
    parsedPressure,
    readingTimestamp,
    source
  );

  res.status(201).json({
    success: true,
    data: {
      reading,
      node: {
        id: node._id,
        deviceId: node.deviceId,
        name: node.name,
        location: node.location,
        maop: node.maop
      },
      alertEvaluation
    }
  });
});

// @desc    Generate simulated pressure readings for all monitoring nodes
// @route   POST /api/readings/simulate
// @access  Private
const simulatePressureReadings = asyncHandler(async (req, res) => {
  const nodes = await Node.find();
  const timestamp = req.body.timestamp ? new Date(req.body.timestamp) : new Date();

  if (Number.isNaN(timestamp.getTime())) {
    return res.status(400).json({ success: false, error: 'timestamp must be a valid date' });
  }

  const readings = [];
  const alertEvaluations = [];

  for (const node of nodes) {
    const pressure = generateSimulatedPressure(node);
    const { reading, alertEvaluation } = await createReadingForNode(
      node,
      pressure,
      timestamp,
      'simulation'
    );

    readings.push(reading);
    alertEvaluations.push({
      nodeId: node._id,
      nodeName: node.name,
      ...alertEvaluation
    });
  }

  res.status(201).json({
    success: true,
    data: {
      readings,
      alertEvaluations,
      source: 'simulation'
    }
  });
});

module.exports = {
  createPressureReading,
  simulatePressureReadings
};
