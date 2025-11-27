const express = require('express');
const router = express.Router();
const { 
  verifyProductBlockchainFirst,
  verifyProductBlockchain,
  getProductJourneyBlockchain
} = require('../controllers/blockchainVerificationController');

// Verify product using blockchain-first approach
router.get('/verify-blockchain/:serialNumber', verifyProductBlockchainFirst);

// Blockchain equivalent of verification/verify API ; fetched from blockchain
router.get('/verify/:serialNumber', verifyProductBlockchain);

// Blockchain equivalent of verification/journey API  
router.get('/journey/:serialNumber', getProductJourneyBlockchain);


module.exports = router;