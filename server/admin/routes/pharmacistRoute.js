const express = require("express");
const router = express.Router();
const {
  getAllPharmacists,
  approvePharmacist
} = require("../controllers/Pharmacist");

// GET all pharmacists
router.get("/", getAllPharmacists);

// PUT approve/disapprove pharmacist
router.put("/:id/approve", approvePharmacist);

module.exports = router;
