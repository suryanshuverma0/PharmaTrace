const { ethers } = require("hardhat");

async function main() {
  // Get contract addresses from deployment
  const productRegistryAddress = "0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82";
  const batchRegistryAddress = "0x9A676e781A523b5d0C0e43731313A708CB607508";
  
  // Get contract instances
  const ProductRegistry = await ethers.getContractFactory("ProductRegistry");
  const BatchRegistry = await ethers.getContractFactory("BatchRegistry");
  
  const productContract = ProductRegistry.attach(productRegistryAddress);
  const batchContract = BatchRegistry.attach(batchRegistryAddress);
  
  console.log("=== BLOCKCHAIN STATE CHECK ===");
  
  // Check total products
  try {
    const totalProducts = await productContract.getTotalProducts();
    console.log(`Total products registered: ${totalProducts}`);
  } catch (error) {
    console.log("Error getting total products:", error.message);
  }
  
  // Check total batches
  try {
    const totalBatches = await batchContract.getTotalBatches();
    console.log(`Total batches registered: ${totalBatches}`);
  } catch (error) {
    console.log("Error getting total batches:", error.message);
  }
  
  // Test the specific fingerprint
  const fingerprint = "91d4f81d358715ba6246da2c5febf2b74487d9d6d2840385f9454275572ef1cd";
  console.log(`\nTesting fingerprint: ${fingerprint}`);
  
  try {
    const productExists = await productContract.productExistsByFingerprint(fingerprint);
    console.log(`Product exists by fingerprint: ${productExists}`);
  } catch (error) {
    console.log("Error checking if product exists:", error.message);
  }
  
  try {
    const product = await productContract.getProductByFingerprint(fingerprint);
    console.log("Product data:", product);
  } catch (error) {
    console.log("Error getting product by fingerprint:", error.message);
  }
  
  // Check if there are any products at all
  try {
    const totalProducts = await productContract.getTotalProducts();
    if (totalProducts > 0) {
      console.log("\n=== LISTING ALL PRODUCTS ===");
      for (let i = 0; i < totalProducts; i++) {
        const fingerprint = await productContract.allProductFingerprints(i);
        console.log(`Product ${i}: ${fingerprint}`);
        try {
          const product = await productContract.getProductByFingerprint(fingerprint);
          console.log(`  - Name: ${product.name}`);
          console.log(`  - Serial: ${product.serialNumber}`);
          console.log(`  - Batch: ${product.batchNumber}`);
        } catch (error) {
          console.log(`  - Error: ${error.message}`);
        }
      }
    }
  } catch (error) {
    console.log("Error listing products:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Script error:", error);
    process.exit(1);
  });