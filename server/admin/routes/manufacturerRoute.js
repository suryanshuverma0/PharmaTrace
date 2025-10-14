const express = require("express");
const router = express.Router();
const { getAllManufacturers, approveManufacturer } = require("../controllers/Manufacturer");

router.get("/", getAllManufacturers);
router.put("/:id/approve", approveManufacturer);

module.exports = router;
