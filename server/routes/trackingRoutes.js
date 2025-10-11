const express = require('express');
const router = express.Router();
const { trackProduct } = require('../controllers/trackingController');
const trackingAnalyticsController = require('../controllers/trackingAnalyticsController');
const auth = require('../middleware/auth');
const authMiddleware = require("../middleware/auth");

// Route to track a product (requires authentication)
router.get('/track/:serialNumber', authMiddleware(["manufacturer"]), trackProduct);

// Analytics routes for manufacturers
router.get('/analytics', auth(["manufacturer"]), trackingAnalyticsController.getManufacturerAnalytics);
router.get('/realtime', auth(["manufacturer"]), trackingAnalyticsController.getRealtimeVerifications);
router.get('/locations', auth(["manufacturer"]), trackingAnalyticsController.getLocationDetails);

module.exports = router;
