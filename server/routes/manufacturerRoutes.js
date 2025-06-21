const express = require("express");
const router = express.Router();
const { getManufacturerDashboard } = require("../controllers/manufacturerController");
const authMiddleware = require("../middleware/auth");

router.get('/dashboard', authMiddleware(["manufacturer"]), getManufacturerDashboard);

module.exports = router;