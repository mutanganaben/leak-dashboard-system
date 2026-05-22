const Settings = require('../models/Settings');
const Node = require('../models/Node');
const Alert = require('../models/Alert');
const PressureReading = require('../models/PressureReading');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../middleware/errorResponse');

const editableFields = [
  'safeThreshold',
  'cautionThreshold',
  'maxPressure',
  'degradationFactor',
  'emailNotifications',
  'smsNotifications',
  'pushNotifications',
  'alertCooldown',
  'dataRetention',
  'updateInterval',
  'maintenanceMode',
  'autoAcknowledgeSafeAlerts'
];

const numericFields = [
  'safeThreshold',
  'cautionThreshold',
  'maxPressure',
  'degradationFactor',
  'alertCooldown',
  'dataRetention',
  'updateInterval'
];

const cleanSettingsPayload = (body) => {
  return editableFields.reduce((payload, field) => {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      payload[field] = body[field];
    }
    return payload;
  }, {});
};

const validateSettings = (settings, next) => {
  for (const field of numericFields) {
    const value = Number(settings[field]);

    if (!Number.isFinite(value)) {
      return next(new ErrorResponse(`${field} must be a valid number`, 400));
    }

    if (value <= 0) {
      return next(new ErrorResponse(`${field} must be greater than 0`, 400));
    }

    settings[field] = value;
  }

  if (settings.safeThreshold >= settings.cautionThreshold) {
    return next(new ErrorResponse('Safe threshold must be less than caution threshold', 400));
  }

  if (settings.cautionThreshold >= settings.maxPressure) {
    return next(new ErrorResponse('Caution threshold must be less than maximum threshold', 400));
  }

  return null;
};

// @desc    Get singleton settings document
// @route   GET /api/settings
// @access  Private
const getSettings = asyncHandler(async (req, res) => {
  const settings = await Settings.getSingleton();
  res.status(200).json({ success: true, data: settings });
});

// @desc    Update singleton settings document
// @route   PUT /api/settings
// @access  Private
const updateSettings = asyncHandler(async (req, res, next) => {
  const currentSettings = await Settings.getSingleton();
  const updates = cleanSettingsPayload(req.body);
  const nextSettings = {
    ...currentSettings.toObject(),
    ...updates
  };

  const validationError = validateSettings(nextSettings, next);
  if (validationError) return validationError;

  const settings = await Settings.findOneAndUpdate(
    { key: currentSettings.key },
    { $set: cleanSettingsPayload(nextSettings) },
    { returnDocument: 'after', runValidators: true }
  );

  res.status(200).json({ success: true, data: settings });
});

// @desc    Reset singleton settings document to defaults
// @route   POST /api/settings/reset
// @access  Private
const resetSettings = asyncHandler(async (req, res) => {
  const settings = await Settings.findOneAndUpdate(
    { key: Settings.defaults().key },
    { $set: Settings.defaults() },
    { returnDocument: 'after', upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );

  res.status(200).json({ success: true, data: settings });
});

// @desc    Get live system status summary
// @route   GET /api/system/status
// @access  Private
const getSystemStatus = asyncHandler(async (req, res) => {
  const [settings, activeDevices, unresolvedAlerts, latestReading] = await Promise.all([
    Settings.getSingleton(),
    Node.countDocuments(),
    Alert.countDocuments({ acknowledged: false }),
    PressureReading.findOne().sort({ timestamp: -1 }).lean()
  ]);

  const status = settings.maintenanceMode
    ? 'Maintenance'
    : unresolvedAlerts > 0
      ? 'Attention Required'
      : 'Operational';

  res.status(200).json({
    success: true,
    data: {
      status,
      activeDevices,
      unresolvedAlerts,
      maintenanceMode: settings.maintenanceMode,
      lastReadingAt: latestReading ? latestReading.timestamp : null,
      message: settings.maintenanceMode
        ? `Maintenance mode active. ${activeDevices} simulation nodes configured.`
        : `Simulation monitoring operational. ${activeDevices} simulation nodes configured.`
    }
  });
});

module.exports = {
  getSettings,
  updateSettings,
  resetSettings,
  getSystemStatus
};
