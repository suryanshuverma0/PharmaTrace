const express = require('express');
const router = express.Router();
const distributorController = require('../controllers/distributerController');
const authMiddleware = require('../middleware/auth');

// Route to register a new distributor
router.get('/list', distributorController.getApprovedDistributors);

// Distributor dashboard API endpoints
router.get('/products', authMiddleware(['distributor']), distributorController.getDistributorProducts);
router.get('/batches', authMiddleware(['distributor']), distributorController.getDistributorBatches);
router.get('/inventory', authMiddleware(['distributor']), distributorController.getDistributorInventory);
router.get('/transfers', authMiddleware(['distributor']), distributorController.getDistributorTransfers);
router.post('/receive', authMiddleware(['distributor']), distributorController.receiveProduct);
router.post('/ship', authMiddleware(['distributor']), distributorController.shipProduct);

module.exports = router;