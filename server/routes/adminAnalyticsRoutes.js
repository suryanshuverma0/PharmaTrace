const express = require('express');
const router = express.Router();
const adminAnalyticsController = require('../controllers/adminAnalyticsController');

// Admin analytics routes
router.get('/analytics', adminAnalyticsController.getAdminAnalytics);
router.get('/realtime-verifications', adminAnalyticsController.getAdminRealtimeVerifications);
router.get('/location-analytics', adminAnalyticsController.getAdminLocationAnalytics);
router.get('/dashboard-stats', adminAnalyticsController.getAdminDashboardStats);
router.get('/recent-activities', adminAnalyticsController.getAdminRecentActivities);
router.get('/system-alerts', adminAnalyticsController.getAdminSystemAlerts);

module.exports = router;