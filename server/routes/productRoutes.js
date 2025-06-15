const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

router.post('/register', productController.registerProduct);
router.get('/get/:serialNumber', productController.getProductOnChain);
router.get('/debug', productController.debugBlockchainConnection);

module.exports = router;