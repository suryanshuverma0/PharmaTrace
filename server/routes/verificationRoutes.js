const express = require('express');
const router = express.Router();
const verificationController = require('../controllers/verificationController');

// Public routes (no authentication required for verification)
router.get('/verify/:serialNumber', verificationController.verifyProduct);
router.get('/journey/:serialNumber', verificationController.getProductJourney);

// Blockchain-based verification routes
router.get('/verify-fingerprint/:fingerprint', verificationController.verifyProductByFingerprint);
router.get('/verify-blockchain/:fingerprint', verificationController.verifyProductBlockchain);

module.exports = router;
