const express = require('express');
const router = express.Router();
const distributorController = require('../controllers/distributerController');


// Route to register a new distributor
router.get('/list', distributorController.getApprovedDistributors);

// Distributor dashboard API endpoints
router.get('/products', distributorController.getDistributorProducts);
router.get('/batches', distributorController.getDistributorBatches);
router.get('/inventory', distributorController.getDistributorInventory);
router.get('/transfers', distributorController.getDistributorTransfers);
router.post('/receive', distributorController.receiveProduct);
router.post('/ship', distributorController.shipProduct);

module.exports = router;