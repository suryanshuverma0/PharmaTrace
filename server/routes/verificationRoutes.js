const express = require('express');
const router = express.Router();
const verificationController = require('../controllers/verificationController');

// Public routes (no authentication required for verification)
router.get('/verify/:serialNumber', verificationController.verifyProduct);
router.get('/journey/:serialNumber', verificationController.getProductJourney);

module.exports = router;
