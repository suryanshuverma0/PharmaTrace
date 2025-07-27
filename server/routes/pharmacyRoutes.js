const express = require("express");
const router = express.Router();
const {getAllPharmacies} = require("../controllers/pharmacyController");
const authMiddleware = require("../middleware/auth");

// Route to get all pharmacies
router.get("/", getAllPharmacies);

module.exports = router;