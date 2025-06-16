const { ethers } = require("ethers");
const Product = require("../models/Product");
const { contract, signer, provider } = require("../utils/blockchain");

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
    const product = await contract.products("SNBLK32");
    console.log("Product data for SNBLK32:", product);
    
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

// FIXED: Updated getProductOnChain with proper debugging and data handling
const getProductOnChain = async (req, res) => {
  // FIXED: Trim the serial number to remove any whitespace/newlines
  const { serialNumber: rawSerialNumber } = req.params;
  const serialNumber = rawSerialNumber.trim();

  try {
    console.log("=== DETAILED DEBUGGING ===");
    console.log("Fetching product for serialNumber:", serialNumber);
    console.log("Contract address:", contract.address || process.env.CONTRACT_ADDRESS);
    console.log("Provider RPC:", process.env.BLOCKCHAIN_RPC);
    console.log("Signer address:", await signer.getAddress());

    // Test the provider and network
    const network = await provider.getNetwork();
    console.log("Connected to network:", network.chainId.toString());

    // Test contract deployment
    const code = await provider.getCode(process.env.CONTRACT_ADDRESS);
    console.log("Contract deployed:", code !== "0x");

    // Get raw product data
    const rawProduct = await contract.products(serialNumber);
    console.log("Raw product data from blockchain:", rawProduct);
    
    // ADDED: Test with the exact same method as your working script
    console.log("=== TESTING WITH DIFFERENT APPROACHES ===");
    
    // Test 1: Try with provider directly
    const contractWithProvider = new ethers.Contract(
      process.env.CONTRACT_ADDRESS,
      contract.interface,
      provider
    );
    const rawProductWithProvider = await contractWithProvider.products(serialNumber);
    console.log("Raw product data using provider:", rawProductWithProvider);
    
    // Test 2: Check if it's a call vs transaction issue
    try {
      const rawProductCall = await contract.products.staticCall(serialNumber);
      console.log("Raw product data using staticCall:", rawProductCall);
    } catch (staticCallError) {
      console.log("staticCall failed:", staticCallError.message);
    }
    
    // Debug each field from all approaches
    console.log("=== RAW PRODUCT FIELDS (signer) ===");
    for (let i = 0; i < rawProduct.length; i++) {
      console.log(`rawProduct[${i}]:`, rawProduct[i], `(type: ${typeof rawProduct[i]})`);
    }
    
    console.log("=== RAW PRODUCT FIELDS (provider) ===");
    for (let i = 0; i < rawProductWithProvider.length; i++) {
      console.log(`rawProductWithProvider[${i}]:`, rawProductWithProvider[i], `(type: ${typeof rawProductWithProvider[i]})`);
    }

    // FIXED: Better product existence check using the working data
    const productToUse = rawProductWithProvider[0] && rawProductWithProvider[0] !== "" ? 
                        rawProductWithProvider : rawProduct;
    
    // Safety check for array length
    if (productToUse.length < 15) {
      console.log("Error: Product array too short, length:", productToUse.length);
      return res.status(500).json({
        error: "Invalid product data structure",
        details: `Expected 15 fields, got ${productToUse.length}`,
        rawData: productToUse
      });
    }
    
    const productName = productToUse[0];
    const productSerialNumber = productToUse[1];
    
    console.log("Product name:", productName);
    console.log("Product serial number:", productSerialNumber);
    console.log("Requested serial number:", serialNumber);
    console.log("Serial numbers match:", productSerialNumber === serialNumber);
    
    // Check if product exists - if name is empty, product doesn't exist
    if (!productName || productName.trim() === "") {
      console.log("Product not found: name is empty");
      return res.status(404).json({ 
        message: "Product not found on blockchain",
        debug: {
          requestedSerial: serialNumber,
          foundName: productName,
          foundSerial: productSerialNumber
        }
      });
    }

    // Additional check: verify serial number matches
    if (productSerialNumber !== serialNumber) {
      console.log("Product not found: serial number mismatch");
      return res.status(404).json({ 
        message: "Product serial number mismatch",
        debug: {
          requestedSerial: serialNumber,
          foundSerial: productSerialNumber
        }
      });
    }

    // FIXED: Correct field mapping based on the ACTUAL data structure from your debug output
    const productFormatted = {
      name: productToUse[0],                                    // 'Paracetamol'
      serialNumber: productToUse[1],                            // 'SNBLK32'
      batchNumber: productToUse[2],                             // 'BN2025'
      manufactureDate: new Date(Number(productToUse[3]) * 1000), // 1749081600n
      expiryDate: new Date(Number(productToUse[4]) * 1000),     // 1750982400n
      manufacturerName: productToUse[5],                        // 'PharmaCorp Inc.'
      manufacturerLicense: productToUse[6],                     // '' (empty)
      productionLocation: productToUse[7],                      // '' (empty)
      drugCode: productToUse[8],                                // 'DC2025' (index 8, not 9!)
      dosageForm: productToUse[9],                              // 'Tablet' (index 9, not 10!)
      strength: productToUse[10],                               // '500mg' (index 10, not 11!)
      storageCondition: productToUse[11],                       // 'Cold' (index 11, not 12!)
      approvalCertificateId: productToUse[12],                  // '' (empty, index 12, not 13!)
      manufacturerCountry: productToUse[13],                    // 'Nepal' (index 13, not 14!)
      manufacturerAddress: productToUse[14],                    // '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199' (index 14, not 15!)
    };

    console.log("Formatted product:", productFormatted);

    return res.json({ 
      success: true,
      product: productFormatted 
    });
    
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({
      error: "Failed to fetch product from blockchain",
      details: error.message,
      stack: error.stack
    });
  }
};

module.exports = { registerProduct, getProductOnChain, debugBlockchainConnection };