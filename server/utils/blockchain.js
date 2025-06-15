require('dotenv').config();
const { ethers } = require("ethers");

// Import your contract ABI
const contractABI = require("../abis/ProductContract.json").abi;

console.log("Setting up blockchain connection...");
console.log("RPC URL:", process.env.BLOCKCHAIN_RPC);
console.log("Contract Address:", process.env.CONTRACT_ADDRESS);

// Create provider with explicit connection
const provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC);

// Create signer
const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
console.log("Signer address:", signer.address);

// Create contract instance
const contract = new ethers.Contract(
  process.env.CONTRACT_ADDRESS, 
  contractABI, 
  signer
);

// Test connection on startup
async function testConnection() {
  try {
    console.log("Testing blockchain connection...");
    
    const network = await provider.getNetwork();
    console.log("✅ Connected to network:", network.chainId.toString());
    
    const balance = await provider.getBalance(signer.address);
    console.log("✅ Signer balance:", ethers.formatEther(balance), "ETH");
    
    const code = await provider.getCode(process.env.CONTRACT_ADDRESS);
    console.log("✅ Contract deployed:", code !== "0x");
    
    // Test a simple contract call
    const testProduct = await contract.products("SN123456");
    console.log("✅ Contract call successful, product name:", testProduct[0]);
    
  } catch (error) {
    console.error("❌ Blockchain connection test failed:", error.message);
  }
}

// Test connection when module loads (with a small delay)
setTimeout(testConnection, 1000);

module.exports = { contract, signer, provider };