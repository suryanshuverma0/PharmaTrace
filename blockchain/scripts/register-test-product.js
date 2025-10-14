// Script to register your existing product on the blockchain for testing
const { ethers } = require('hardhat');

async function main() {
  // Get the deployed contracts
  const productRegistryAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const batchRegistryAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
  
  const ProductRegistry = await ethers.getContractFactory("ProductRegistry");
  const BatchRegistry = await ethers.getContractFactory("BatchRegistry");
  
  const productContract = ProductRegistry.attach(productRegistryAddress);
  const batchContract = BatchRegistry.attach(batchRegistryAddress);
  
  // Your product data
  const productData = {
    fingerprint: "aeb4164d393bff768949aa00685a377716f1409acd72b22f2cfe7b02dd441eb6",
    name: "HARDAT PRODUCT",
    serialNumber: "HRD123",
    batchNumber: "HARDAT",
    manufactureDate: Math.floor(new Date("2025-10-06T00:00:00.000Z").getTime() / 1000),
    expiryDate: Math.floor(new Date("2029-07-11T00:00:00.000Z").getTime() / 1000),
    manufacturerName: "PharmaTraceCorp.Pvt.Lts",
    dosageForm: "Syrup",
    strength: "200 mg"
  };
  
  const batchData = {
    batchNumber: "HARDAT",
    manufactureDate: Math.floor(new Date("2025-10-06T00:00:00.000Z").getTime() / 1000),
    expiryDate: Math.floor(new Date("2029-07-11T00:00:00.000Z").getTime() / 1000),
    quantityProduced: 1000,
    quantityAvailable: 1000,
    dosageForm: "Syrup",
    strength: "200 mg",
    manufacturerName: "PharmaTraceCorp.Pvt.Lts",
    digitalFingerprint: "aeb4164d393bff768949aa00685a377716f1409acd72b22f2cfe7b02dd441eb6"
  };
  
  try {
    console.log("Registering batch on blockchain...");
    const batchTx = await batchContract.registerBatch(
      batchData.batchNumber,
      batchData.manufactureDate,
      batchData.expiryDate,
      batchData.quantityProduced,
      batchData.quantityAvailable,
      batchData.dosageForm,
      batchData.strength,
      batchData.manufacturerName,
      batchData.digitalFingerprint
    );
    
    await batchTx.wait();
    console.log("✅ Batch registered successfully:", batchTx.hash);
    
    console.log("Registering product on blockchain...");
    const productTx = await productContract.registerProduct(
      productData.fingerprint,
      productData.name,
      productData.serialNumber,
      productData.batchNumber,
      productData.manufactureDate,
      productData.expiryDate,
      productData.manufacturerName,
      productData.dosageForm,
      productData.strength
    );
    
    await productTx.wait();
    console.log("✅ Product registered successfully:", productTx.hash);
    
    // Test verification
    console.log("\nTesting product lookup...");
    const retrievedProduct = await productContract.getProductByFingerprint(productData.fingerprint);
    console.log("✅ Product retrieved:", {
      name: retrievedProduct.name,
      serialNumber: retrievedProduct.serialNumber,
      batchNumber: retrievedProduct.batchNumber,
      manufacturerName: retrievedProduct.manufacturerName,
      isActive: retrievedProduct.isActive
    });
    
    console.log("\n🎉 Your product is now registered on blockchain!");
    console.log("You can now test the verification endpoint:");
    console.log(`GET http://localhost:3000/api/verification/verify-blockchain/${productData.fingerprint}`);
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});