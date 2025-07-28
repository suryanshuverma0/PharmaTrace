const express = require('express');
const router = express.Router();
const { trackProduct } = require('../controllers/trackingController');
const auth = require('../middleware/auth');
const authMiddleware = require("../middleware/auth");


// Route to track a product (requires authentication)
router.get('/track/:serialNumber', authMiddleware(["manufacturer"]), trackProduct);

module.exports = router;
