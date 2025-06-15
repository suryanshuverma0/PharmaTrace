// Create this simple test file: testAccountComparison.js
const { ethers } = require("hardhat");

async function main() {
  console.log("=== ACCOUNT COMPARISON ===");
  
  // Get Hardhat's default accounts
  const [deployer, addr1, addr2] = await ethers.getSigners();
  console.log("Hardhat account 0 (deployer):", deployer.address);
  console.log("Hardhat account 1:", addr1.address);
  console.log("Hardhat account 2:", addr2.address);
  
  // Your API's private key account
  const apiPrivateKey = "0xdf57089febbacf7ba0bc227dafbffa9fc08a93fdc68e1e42411a14efcf23656e";
  const apiWallet = new ethers.Wallet(apiPrivateKey);
  console.log("API wallet address:", apiWallet.address);
  
  console.log("\n=== COMPARISON ===");
  console.log("API matches deployer:", apiWallet.address === deployer.address);
  console.log("API matches addr1:", apiWallet.address === addr1.address);
  console.log("API matches addr2:", apiWallet.address === addr2.address);
  
  // Test contract with different signers
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const ProductRegistry = await ethers.getContractFactory("ProductRegistry");
  
  console.log("\n=== TESTING WITH DIFFERENT SIGNERS ===");
  
  // Test with deployer (hardhat default)
  const contractWithDeployer = ProductRegistry.attach(contractAddress).connect(deployer);
  const productWithDeployer = await contractWithDeployer.products("SN123456");
  console.log("Product with deployer:", productWithDeployer[0]); // Just show name
  
  // Test with API wallet (connected to same provider)
  const apiWalletConnected = apiWallet.connect(ethers.provider);
  const contractWithAPI = ProductRegistry.attach(contractAddress).connect(apiWalletConnected);
  const productWithAPI = await contractWithAPI.products("SN123456");
  console.log("Product with API wallet:", productWithAPI[0]); // Just show name
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });