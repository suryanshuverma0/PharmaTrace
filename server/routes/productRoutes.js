const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const authMiddleware = require("../middleware/auth");



router.post('/register',authMiddleware(["manufacturer"]), productController.registerProduct);
router.get('/get/:serialNumber', productController.getProductOnChain);
router.get('/fingerprint/:fingerprint', productController.getProductByFingerprint); // New route for fingerprint-based lookup
router.get('/debug', productController.debugBlockchainConnection);
router.get('/registered-product', authMiddleware(["manufacturer"]), productController.getManufacturerProducts);
router.get('/registered-batches', authMiddleware(["manufacturer"]), productController.getManufacturerBatches);

module.exports = router;