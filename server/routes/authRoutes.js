const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/register', authController.registerUser);
router.post('/login', authController.loginUser);
router.get('/activate-account/:token', authController.activateUser);
router.get('/user/:address', authController.getUserByAddress);

module.exports = router;
