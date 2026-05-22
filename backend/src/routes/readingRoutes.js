const express = require('express');
const router = express.Router();
const { createPressureReading, simulatePressureReadings } = require('../controllers/readingController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/simulate', simulatePressureReadings);
router.post('/', createPressureReading);

module.exports = router;
