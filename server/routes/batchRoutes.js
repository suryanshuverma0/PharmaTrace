const express = require("express");
const router = express.Router();
const { registerBatch, getBatches , getAvailableBatches, assignBatchToDistributor,getRecentlyAssignedBatches } = require("../controllers/batchController");
const authMiddleware = require("../middleware/auth");

router.post("/register", authMiddleware(["manufacturer"]), registerBatch);
router.get("/", authMiddleware(["manufacturer"]), getBatches);
router.get("/available", authMiddleware(["manufacturer"]), getAvailableBatches);
router.post('/:batchId/assign',authMiddleware(), assignBatchToDistributor);
router.get('/assigned-batches',authMiddleware(["manufacturer"]), getRecentlyAssignedBatches);

module.exports = router;