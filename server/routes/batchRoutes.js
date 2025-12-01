const express = require("express");
const router = express.Router();
const { registerBatch, getBatches , getAvailableBatches, getAvailableBatchesForProducts, assignBatchToDistributor,getRecentlyAssignedBatches, getBatchGenerationStatus, getBatchVerificationStatus } = require("../controllers/batchController");
const authMiddleware = require("../middleware/auth");

router.post("/register", authMiddleware(["manufacturer"]), registerBatch);
router.get("/", authMiddleware(["manufacturer"]), getBatches);
router.get("/available", authMiddleware(["manufacturer"]), getAvailableBatches);
router.get("/available-for-products", authMiddleware(["manufacturer"]), getAvailableBatchesForProducts);
router.post('/:batchId/assign',authMiddleware(["manufacturer"]), assignBatchToDistributor);
router.get('/assigned-batches',authMiddleware(["manufacturer"]), getRecentlyAssignedBatches);
router.get('/:batchId/generation-status', authMiddleware(["manufacturer"]), getBatchGenerationStatus);
router.get('/:batchNumber/verification-status', getBatchVerificationStatus);

module.exports = router;