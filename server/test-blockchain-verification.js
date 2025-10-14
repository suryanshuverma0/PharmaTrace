// Test script to demonstrate the new blockchain verification controller
const express = require('express');
const app = express();

// Mock blockchain response for testing
const mockBlockchainProduct = {
  name: "Aspirin 100mg",
  serialNumber: "ASP001234",
  batchNumber: "BATCH001",
  manufactureDate: Math.floor(new Date('2024-01-01').getTime() / 1000),
  expiryDate: Math.floor(new Date('2026-01-01').getTime() / 1000),
  manufacturerName: "PharmaCorp Ltd",
  dosageForm: "Tablet",
  strength: "100mg",
  manufacturerAddress: "0x1234567890123456789012345678901234567890",
  digitalFingerprint: "test-fingerprint-123",
  registrationTimestamp: Math.floor(new Date().getTime() / 1000),
  isActive: true
};

// Mock the blockchain verification controller response format
function mockVerifyProductBlockchain(fingerprint) {
  const product = mockBlockchainProduct;
  
  // Check expiry
  const expiryDate = new Date(Number(product.expiryDate) * 1000);
  const today = new Date();
  const isExpired = today > expiryDate;
  const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
  
  // Authenticity
  const isAuthentic = !!product.serialNumber && !!product.batchNumber && !!product.manufacturerName;
  
  // Format response matching the MongoDB controller format
  const verificationResult = {
    success: true,
    isAuthentic,
    isExpired,
    daysUntilExpiry,
    product: {
      productName: product.name,
      serialNumber: product.serialNumber,
      batchNumber: product.batchNumber,
      manufactureDate: new Date(Number(product.manufactureDate) * 1000),
      expiryDate,
      dosageForm: product.dosageForm,
      strength: product.strength
    },
    manufacturer: {
      name: product.manufacturerName
    },
    currentLocation: {
      location: "Manufacturing Facility",
      actor: product.manufacturerName,
      lastUpdated: new Date(Number(product.manufactureDate) * 1000)
    },
    blockchain: {
      verified: true,
      fingerprint,
      contractAddress: "0x5FbDB2315678afecb367f032d93F642f64180aa3"
    },
    verification: {
      verifiedAt: new Date(),
      verificationStatus: isAuthentic ? 'verified' : 'suspicious',
      fingerprint
    },
    shipmentHistory: []
  };
  
  return verificationResult;
}

// Test endpoint
app.get('/test-blockchain/:fingerprint', (req, res) => {
  try {
    const { fingerprint } = req.params;
    const result = mockVerifyProductBlockchain(fingerprint);
    res.json(result);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Test failed', 
      error: error.message 
    });
  }
});

app.listen(3001, () => {
  console.log('Test server running on port 3001');
  console.log('Test the endpoint: http://localhost:3001/test-blockchain/test-fingerprint-123');
});