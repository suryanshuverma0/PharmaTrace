const express = require("express");
const router = express.Router();
const { 
  getManufacturerDashboard,
  getManufacturerProfile
} = require("../controllers/manufacturerController");
const authMiddleware = require("../middleware/auth");

router.get('/dashboard', authMiddleware(["manufacturer"]), getManufacturerDashboard);
router.get('/profile', authMiddleware(["manufacturer"]), getManufacturerProfile);

module.exports = router;