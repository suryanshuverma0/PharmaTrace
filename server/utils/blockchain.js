require('dotenv').config();
const { ethers } = require('ethers');

// Import ABIs for both contracts
const productContractABI = require('../../blockchain/artifacts/contracts/ProductRegistry.sol/ProductRegistry.json').abi;
const batchContractABI = require('../../blockchain/artifacts/contracts/BatchRegistry.sol/BatchRegistry.json').abi;

// Validate environment variables
if (!process.env.BLOCKCHAIN_RPC) {
  throw new Error('BLOCKCHAIN_RPC is not set in .env');
}
if (!process.env.PRIVATE_KEY) {
  throw new Error('PRIVATE_KEY is not set in .env');
}
if (!process.env.CONTRACT_ADDRESS) {
  throw new Error('CONTRACT_ADDRESS is not set in .env');
}
if (!process.env.BATCH_CONTRACT_ADDRESS) {
  throw new Error('BATCH_CONTRACT_ADDRESS is not set in .env');
}

// Initialize provider and signer
const provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC, undefined, {
  ensNetwork: undefined,
});

let signer;
try {
  signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
} catch (error) {
  throw new Error(`Failed to initialize signer: ${error.message}`);
}

// Initialize both contracts
const productContract = new ethers.Contract(process.env.CONTRACT_ADDRESS, productContractABI, signer);
const batchContract = new ethers.Contract(process.env.BATCH_CONTRACT_ADDRESS, batchContractABI, signer);

async function testConnection() {
  try {
    // Test network connection
    const network = await provider.getNetwork();
    console.log('✅ Connected to network:', network.chainId.toString());

    // Test signer balance
    const balance = await provider.getBalance(signer.address);
    console.log('✅ Signer balance:', ethers.formatEther(balance), 'ETH');

    // Test Product contract deployment
    const productCode = await provider.getCode(process.env.CONTRACT_ADDRESS);
    console.log('✅ Product Contract deployed:', productCode !== '0x');

    // Test Batch contract deployment
    const batchCode = await provider.getCode(process.env.BATCH_CONTRACT_ADDRESS);
    console.log('✅ Batch Contract deployed:', batchCode !== '0x');

    // Test Product contract interaction
    try {
      const testProduct = await productContract.products('SNBLK32');
      console.log('✅ Product Contract call successful, product data:', testProduct);
    } catch (contractError) {
      console.warn('⚠️ Product Contract call failed, may be expected if no product exists:', contractError.message);
    }

    // Test Batch contract interaction
    try {
      const totalBatches = await batchContract.getTotalBatches();
      console.log('✅ Batch Contract call successful, total batches:', totalBatches.toString());
    } catch (contractError) {
      console.warn('⚠️ Batch Contract call failed:', contractError.message);
    }

  } catch (error) {
    console.error('❌ Blockchain connection test failed:', error.message, error.stack);
  }
}

// Run test connection after a delay
setTimeout(testConnection, 1000);

// Export both contracts with clear naming
module.exports = { 
  // Product-related exports (maintaining backward compatibility)
  contract: productContract,
  signer, 
  provider,
  
  // Explicit exports for better clarity
  productContract,
  batchContract,
};