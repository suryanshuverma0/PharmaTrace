const express = require("express");
const router = express.Router();
const {
  getAllPharmacies,
  getPharmacyDashboard,
  confirmReceipt,
  getExpiryAlerts,
  getInventory
} = require("../controllers/pharmacyController");
const authMiddleware = require("../middleware/auth");

// Route to get all pharmacies
router.get("/", getAllPharmacies);


// Route to get pharmacy dashboard data
router.get("/dashboard", authMiddleware(['pharmacist']), getPharmacyDashboard);

// Route to confirm receipt of a batch
router.post("/confirm-receipt/:distributionId", authMiddleware(['pharmacist']), confirmReceipt);

// Route to get expiry alerts
router.get("/expiry-alerts", authMiddleware(['pharmacist']), getExpiryAlerts);

// Route to get pharmacy inventory
router.get("/inventory", authMiddleware(['pharmacist']), getInventory);

module.exports = router;