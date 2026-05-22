const Alert = require('../models/Alert');
const Settings = require('../models/Settings');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../middleware/errorResponse');
const { sendAlertEmail } = require('../config/mailer');

const getAlertLevel = (node, settings) => {
  const utilization = node.maop > 0 ? (node.pressure / node.maop) * 100 : 0;

  if (node.pressure >= settings.maxPressure || utilization >= settings.cautionThreshold) {
    return { level: 'warning', utilization };
  }

  if (utilization >= settings.safeThreshold) {
    return { level: 'caution', utilization };
  }

  return { level: 'safe', utilization };
};

const shouldSendEmail = (settings) => {
  return Boolean(
    settings.emailNotifications &&
    process.env.EMAIL_USER &&
    process.env.EMAIL_PASS &&
    process.env.ALERT_RECIPIENT_EMAIL &&
    !process.env.EMAIL_USER.startsWith('your_') &&
    !process.env.EMAIL_PASS.startsWith('your_')
  );
};

const createAlert = async (node, level, utilization, settings) => {
  const message = `${level.toUpperCase()} simulated pressure condition on ${node.name} at ${node.location}: ${node.pressure} PSI (${utilization.toFixed(1)}% utilization).`;
  const alert = await Alert.create({
    nodeId: node._id,
    nodeName: node.name,
    location: node.location,
    pressure: node.pressure,
    utilization: parseFloat(utilization.toFixed(1)),
    level,
    message,
    notificationChannels: {
      email: Boolean(settings.emailNotifications),
      sms: Boolean(settings.smsNotifications),
      push: Boolean(settings.pushNotifications)
    }
  });

  if (shouldSendEmail(settings)) {
    sendAlertEmail(alert).catch((error) => {
      console.error('Alert email dispatch failed:', error.message);
    });
  }

  return alert;
};

const evaluateNodeReading = async (node, pressure) => {
  const settings = await Settings.getSingleton();
  const now = new Date();
  const cooldownMs = settings.alertCooldown * 60 * 1000;
  const nodeSnapshot = {
    ...(node.toObject?.() || node),
    pressure
  };

  if (settings.maintenanceMode) {
    return {
      created: 0,
      autoAcknowledged: 0,
      skipped: 1,
      maintenanceMode: true
    };
  }

  let created = 0;
  let autoAcknowledged = 0;
  let skipped = 0;
  let alert = null;
  const { level, utilization } = getAlertLevel(nodeSnapshot, settings);

  if (level === 'safe') {
    if (settings.autoAcknowledgeSafeAlerts) {
      const result = await Alert.updateMany(
        { nodeId: nodeSnapshot._id, acknowledged: false },
        {
          acknowledged: true,
          acknowledgedAt: now,
          resolvedAt: now,
          autoAcknowledged: true
        }
      );
      autoAcknowledged += result.modifiedCount || 0;
    }

    return {
      created,
      autoAcknowledged,
      skipped,
      maintenanceMode: false,
      level,
      utilization: parseFloat(utilization.toFixed(1)),
      alert
    };
  }

  const activeAlerts = await Alert.find({ nodeId: nodeSnapshot._id, acknowledged: false });
  const sameLevelActive = activeAlerts.some((activeAlert) => activeAlert.level === level);

  if (sameLevelActive) {
    skipped++;
    return {
      created,
      autoAcknowledged,
      skipped,
      maintenanceMode: false,
      level,
      utilization: parseFloat(utilization.toFixed(1)),
      alert
    };
  }

  if (activeAlerts.length > 0) {
    const result = await Alert.updateMany(
      { nodeId: nodeSnapshot._id, acknowledged: false },
      {
        acknowledged: true,
        acknowledgedAt: now,
        resolvedAt: now,
        autoAcknowledged: true
      }
    );
    autoAcknowledged += result.modifiedCount || 0;
  }

  const latestSameLevelAlert = await Alert.findOne({ nodeId: nodeSnapshot._id, level }).sort({ createdAt: -1 });
  const insideCooldown = latestSameLevelAlert && now - latestSameLevelAlert.createdAt < cooldownMs;

  if (insideCooldown) {
    skipped++;
    return {
      created,
      autoAcknowledged,
      skipped,
      maintenanceMode: false,
      level,
      utilization: parseFloat(utilization.toFixed(1)),
      alert
    };
  }

  alert = await createAlert(nodeSnapshot, level, utilization, settings);
  created++;

  return {
    created,
    autoAcknowledged,
    skipped,
    maintenanceMode: false,
    level,
    utilization: parseFloat(utilization.toFixed(1)),
    alert
  };
};

// @desc    Get all alerts
// @route   GET /api/alerts
// @access  Private
const getAlerts = asyncHandler(async (req, res) => {
  const settings = await Settings.getSingleton();
  const query = {};

  if (req.query.acknowledged !== undefined) {
    query.acknowledged = req.query.acknowledged === 'true';
  }

  if (req.query.level) {
    query.level = req.query.level.toLowerCase();
  }

  const alerts = await Alert.find(query).sort({ createdAt: -1 });
  res.status(200).json({
    success: true,
    data: {
      alerts,
      syncSummary: {
        created: 0,
        autoAcknowledged: 0,
        skipped: 0,
        maintenanceMode: settings.maintenanceMode
      }
    }
  });
});

// @desc    Acknowledge an alert
// @route   PUT /api/alerts/:id/acknowledge
// @access  Private
const acknowledgeAlert = asyncHandler(async (req, res, next) => {
  const alert = await Alert.findByIdAndUpdate(
    req.params.id,
    {
      acknowledged: true,
      acknowledgedAt: new Date()
    },
    { returnDocument: 'after', runValidators: true }
  );

  if (!alert) {
    return next(new ErrorResponse(`Alert not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({ success: true, data: alert });
});

module.exports = {
  getAlerts,
  acknowledgeAlert,
  evaluateNodeReading
};
