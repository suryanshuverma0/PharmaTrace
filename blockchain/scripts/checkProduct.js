// scripts/checkProduct.js
const { ethers } = require("ethers");
const abi = require("../artifacts/contracts/ProductRegistry.sol/ProductRegistry.json").abi;

const provider = new ethers.JsonRpcProvider("http://localhost:8545");
const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Your deployed address

const contract = new ethers.Contract(contractAddress, abi, provider);

const serialNumber = "SNBLK32";

async function main() {
  const product = await contract.products(serialNumber);
  console.log("Product from blockchain:", product);
}

main().catch(console.error);
