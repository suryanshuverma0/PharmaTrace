const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const authMiddleware = require("../middleware/auth");



router.post('/register',authMiddleware(["manufacturer"]), productController.registerProduct);
router.get('/get/:serialNumber', productController.getProductOnChain);
router.get('/debug', productController.debugBlockchainConnection);

module.exports = router;