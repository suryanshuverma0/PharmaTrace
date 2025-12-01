// routes/nepalRoutes.js
const express = require("express");
const { getAllDistricts } = require("../controllers/districtsController");

const router = express.Router();

// Route to get districts
router.get("/districts", getAllDistricts);

module.exports = router;
