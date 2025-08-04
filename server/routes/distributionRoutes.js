const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");

// Controllers will be defined here
const {
  getAvailableBatches,
  assignToPharmacy,
  getDistributionHistory,
  updateShipmentStatus
} = require("../controllers/distributionController");

// All routes require distributor role
router.use(authMiddleware(["distributor"]));

// Get available batches for the logged-in distributor
router.get('/available-batches', getAvailableBatches);

// Assign batch to pharmacy
router.post('/assign', assignToPharmacy);

// Get distribution history for the logged-in distributor
router.get('/history', getDistributionHistory);

// Update shipment status
router.post('/update-status', updateShipmentStatus);

module.exports = router;
