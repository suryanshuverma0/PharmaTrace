const express = require("express");
const router = express.Router();
const {
  getAllDistributors,
  approveDistributor
} = require("../controllers/Distributor");

router.get("/", getAllDistributors);
router.put("/:id/approve", approveDistributor);

module.exports = router;
