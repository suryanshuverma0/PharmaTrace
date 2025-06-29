const express = require('express');
const router = express.Router();
const distributorController = require('../controllers/distributerController');

// Route to register a new distributor
router.get('/list', distributorController.getApprovedDistributors);

module.exports = router;