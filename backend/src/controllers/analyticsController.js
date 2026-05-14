const Node = require('../models/Node');
const PressureReading = require('../models/PressureReading');
const Settings = require('../models/Settings');
const asyncHandler = require('../middleware/asyncHandler');

const getRangeConfig = (range) => {
  const since = new Date();

  if (range === '7d') {
    since.setDate(since.getDate() - 7);
    return {
      since,
      bucketFormat: '%Y-%m-%d',
      labelFormat: { month: 'short', day: 'numeric' }
    };
  }

  if (range === '30d') {
    since.setDate(since.getDate() - 30);
    return {
      since,
      bucketFormat: '%Y-%m-%d',
      labelFormat: { month: 'short', day: 'numeric' }
    };
  }

  since.setHours(since.getHours() - 24);
  return {
    since,
    bucketFormat: '%Y-%m-%dT%H:00:00Z',
    labelFormat: { hour: '2-digit', minute: '2-digit', hour12: false }
  };
};

const formatTrendLabel = (bucket, labelFormat) => {
  const date = new Date(bucket);
  return date.toLocaleString('en-US', labelFormat);
};

/**
 * @desc    Get analytics data for charts and metrics
 * @route   GET /api/dashboard/analytics
 * @access  Private
 */
const getAnalytics = asyncHandler(async (req, res, next) => {
  const { range = '24h' } = req.query;
  const { since, bucketFormat, labelFormat } = getRangeConfig(range);

  const [nodes, settings, pressureStats, trendBuckets] = await Promise.all([
    Node.aggregate([
      {
        $lookup: {
          from: 'pressurereadings',
          let: { nodeId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$nodeId', '$$nodeId'] } } },
            { $sort: { timestamp: -1 } },
            { $limit: 1 }
          ],
          as: 'latestReading'
        }
      },
      {
        $addFields: {
          currentPressure: { $ifNull: [{ $arrayElemAt: ['$latestReading.pressure', 0] }, 0] }
        }
      },
      { $project: { latestReading: 0 } },
      { $sort: { createdAt: -1 } }
    ]),
    Settings.getSingleton(),
    PressureReading.aggregate([
      { $match: { timestamp: { $gte: since } } },
      {
        $group: {
          _id: null,
          averagePressure: { $avg: '$pressure' },
          peakPressure: { $max: '$pressure' },
          readingCount: { $sum: 1 }
        }
      }
    ]),
    PressureReading.aggregate([
      { $match: { timestamp: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: bucketFormat, date: '$timestamp' } },
          minPressure: { $min: '$pressure' },
          averagePressure: { $avg: '$pressure' },
          maxPressure: { $max: '$pressure' },
          readingCount: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ])
  ]);
  
  let safeCount = 0;
  let cautionCount = 0;
  let warningCount = 0;
  const utilizationData = [];

  for (const node of nodes) {
    const pressure = node.currentPressure || 0;
    const maop = node.maop || 100;
    const utilization = (pressure / maop) * 100;

    if (pressure >= settings.maxPressure || utilization >= settings.cautionThreshold) warningCount++;
    else if (utilization >= settings.safeThreshold) cautionCount++;
    else safeCount++;

    utilizationData.push({
      name: node.name,
      value: parseFloat(utilization.toFixed(1))
    });
  }

  const stats = pressureStats[0] || {};
  const avgPressure = stats.averagePressure || 0;
  const peakPressureValue = stats.peakPressure || 0;
  const averageUtilization = nodes.length > 0
    ? utilizationData.reduce((acc, curr) => acc + curr.value, 0) / nodes.length
    : 0;
  const pressureTrend = trendBuckets.map((bucket) => ({
    date: formatTrendLabel(bucket._id, labelFormat),
    timestamp: new Date(bucket._id).getTime(),
    minPressure: parseFloat(bucket.minPressure.toFixed(2)),
    averagePressure: parseFloat(bucket.averagePressure.toFixed(2)),
    maxPressure: parseFloat(bucket.maxPressure.toFixed(2)),
    readingCount: bucket.readingCount
  }));

  const statusData = [
    { name: "Safe", value: safeCount, color: "#10b981" },
    { name: "Caution", value: cautionCount, color: "#f59e0b" },
    { name: "Warning", value: warningCount, color: "#ef4444" },
  ];

  res.status(200).json({
    success: true,
    data: {
      metrics: {
        averagePressure: `${avgPressure.toFixed(2)} PSI`,
        peakPressure: `${peakPressureValue.toFixed(2)} PSI`,
        averageUtilization: `${averageUtilization.toFixed(1)}%`,
        readingCount: stats.readingCount || 0
      },
      statusData,
      utilizationData,
      pressureTrend
    }
  });
});

module.exports = {
  getAnalytics
};
