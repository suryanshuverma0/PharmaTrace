const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

const uploadLicense = require('../middleware/uploadLicense');

// Registration with file upload
router.post(
  '/register',
  uploadLicense.single('licenseDocument'), // licenseDocument field name
  authController.registerUser
);


// router.post('/register', authController.registerUser);
router.post('/login', authController.loginUser);
router.get('/activate-account/:token', authController.activateUser);
router.get('/user/:address', authController.getUserByAddress);
router.post('/check-superadmin', authController.checkSuperAdmin);

module.exports = router;
