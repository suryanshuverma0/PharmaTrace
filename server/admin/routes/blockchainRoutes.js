const express = require("express");
const router = express.Router();
const blockchainController = require("../controllers/admin/blockchainController");



// GET all grouped TXs
router.get("/blockchain-activity", blockchainController.getAllTxs);

// GET single record details
router.get("/blockchain-activity/:type/:id", blockchainController.getTxDetails);

// POST reverify a record
router.post("/blockchain-activity/:type/:id/reverify", blockchainController.reverifyTx);

module.exports = router;
