// utils/blockchain.js
require('dotenv').config();
const { ethers } = require("ethers");

// Use the same ABI as checkProduct.js
const contractABI = require("../../blockchain/artifacts/contracts/ProductRegistry.sol/ProductRegistry.json").abi;

console.log("Setting up blockchain connection...");
console.log("RPC URL:", process.env.BLOCKCHAIN_RPC);
console.log("Contract Address:", process.env.CONTRACT_ADDRESS);

// Disable ENS resolution
const provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC, undefined, {
  ensNetwork: undefined,
});

const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
console.log("Signer address:", signer.address);

const contract = new ethers.Contract(
  process.env.CONTRACT_ADDRESS,
  contractABI,
  signer
);

async function testConnection() {
  try {
    console.log("Testing blockchain connection...");
    const network = await provider.getNetwork();
    console.log("✅ Connected to network:", network.chainId.toString());
    
    const balance = await provider.getBalance(signer.address);
    console.log("✅ Signer balance:", ethers.formatEther(balance), "ETH");
    
    const code = await provider.getCode(process.env.CONTRACT_ADDRESS);
    console.log("✅ Contract deployed:", code !== "0x");
    
    const testProduct = await contract.products("SNBLK32"); // Test with known serial number
    console.log("✅ Contract call successful, product data:", testProduct);
    
  } catch (error) {
    console.error("❌ Blockchain connection test failed:", error.message);
  }
}

setTimeout(testConnection, 1000);

module.exports = { contract, signer, provider };