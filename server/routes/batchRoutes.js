const express = require("express");
const router = express.Router();
const { registerBatch, getBatches } = require("../controllers/batchController");
const authMiddleware = require("../middleware/auth");

router.post("/register", authMiddleware(["manufacturer"]), registerBatch);
router.get("/", authMiddleware(["manufacturer"]), getBatches);

module.exports = router;