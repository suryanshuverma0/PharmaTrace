const { ethers } = require("ethers");
const Product = require("../models/Product");
const { contract, signer } = require("../utils/blockchain");

const registerProduct = async (req, res) => {
  try {
    const {
      name,
      serialNumber,
      batchNumber,
      manufactureDate,
      expiryDate,
      manufacturerName,
      manufacturerLicense,
      productionLocation,
      drugCode,
      dosageForm,
      strength,
      storageCondition,
      approvalCertificateId,
      manufacturerCountry,
    } = req.body;

    // Call smart contract function
    const tx = await contract.registerProduct(
      name,
      serialNumber,
      batchNumber,
      Math.floor(new Date(manufactureDate).getTime() / 1000),
      Math.floor(new Date(expiryDate).getTime() / 1000),
      manufacturerName,
      manufacturerLicense,
      productionLocation,
      drugCode,
      dosageForm,
      strength,
      storageCondition,
      approvalCertificateId,
      manufacturerCountry
    );

    const receipt = await tx.wait();

    const newProduct = await Product.create({
      name,
      serialNumber,
      batchNumber,
      manufactureDate,
      expiryDate,
      manufacturerName,
      manufacturerLicense,
      productionLocation,
      drugCode,
      dosageForm,
      strength,
      storageCondition,
      approvalCertificateId,
      manufacturerCountry,
      txHash: receipt.transactionHash,
      manufacturerAddress: signer.address,
      digitalFingerprint: ethers.keccak256(ethers.toUtf8Bytes(serialNumber + batchNumber)),
    });

    res.status(201).json({ message: "Product registered", product: newProduct });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to register product", details: error.message });
  }
};


// Add this debugging function to your controller
const debugBlockchainConnection = async (req, res) => {
  try {
    console.log("=== Debugging Blockchain Connection ===");
    console.log("Contract address:", process.env.CONTRACT_ADDRESS);
    console.log("RPC URL:", process.env.BLOCKCHAIN_RPC);
    console.log("Signer address:", signer.address);
    
    // Check if contract is deployed
    const code = await signer.provider.getCode(process.env.CONTRACT_ADDRESS);
    console.log("Contract code exists:", code !== "0x");
    
    // Check network
    const network = await signer.provider.getNetwork();
    console.log("Network:", network);
    
    // Try to call a view function to test connection
    const product = await contract.products("SN123456");
    console.log("Product data for SN123456:", product);
    
    res.json({
      contractAddress: process.env.CONTRACT_ADDRESS,
      rpcUrl: process.env.BLOCKCHAIN_RPC,
      signerAddress: signer.address,
      contractExists: code !== "0x",
      network: network,
      productData: product
    });
    
  } catch (error) {
    console.error("Debug error:", error);
    res.status(500).json({ error: error.message });
  }
};

// Updated getProductOnChain with better debugging
const getProductOnChain = async (req, res) => {
  const { serialNumber } = req.params;

  try {
    const product = await contract.products(serialNumber);
    
    console.log("Raw product data from blockchain:", product);

    // Check if product exists - check if name is empty or if it's the default struct
    if (!product || !product[0] || product[0] === "" || product[0] === undefined) {
      return res.status(404).json({ message: "Product not found on blockchain" });
    }

    // Handle BigInt conversion properly
    const manufactureTimestamp = typeof product[3] === 'bigint' ? Number(product[3]) : product[3];
    const expiryTimestamp = typeof product[4] === 'bigint' ? Number(product[4]) : product[4];

    const productFormatted = {
      name: product[0],                    // name
      serialNumber: product[1],           // serialNumber  
      batchNumber: product[2],            // batchNumber
      manufactureDate: new Date(manufactureTimestamp * 1000),
      expiryDate: new Date(expiryTimestamp * 1000),
      manufacturerName: product[5],       // manufacturerName
      manufacturerLicense: product[6],    // manufacturerLicense
      productionLocation: product[7],     // productionLocation
      drugCode: product[8],              // drugCode
      dosageForm: product[9],            // dosageForm
      strength: product[10],             // strength
      storageCondition: product[11],     // storageCondition
      approvalCertificateId: product[12], // approvalCertificateId
      manufacturerCountry: product[13],  // manufacturerCountry
      manufacturerAddress: product[14],  // manufacturerAddress (this should be index 14)
    };

    res.json({ product: productFormatted });
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ error: "Failed to fetch product from blockchain", details: error.message });
  }
};


module.exports = { registerProduct, getProductOnChain, debugBlockchainConnection };
