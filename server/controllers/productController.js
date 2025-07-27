// const { ethers } = require("ethers"); // Commented for MVP
const mongoose = require('mongoose');
const QRCode = require('qrcode');

const Product = require("../models/Product");
// const { contract, signer, provider } = require("../utils/blockchain"); // Commented for MVP
const Batch = require("../models/Batch");
const Manufacturer = require("../models/Manufacturer");


const registerProduct = async (req, res) => {
  try {
    const {
      productName,
      serialNumber,
      batchNumber,
      drugCode,
      price
    } = req.body;

    // Validate required fields
    if (!productName || !serialNumber || !batchNumber || !price) {
      return res.status(400).json({ message: 'All required fields must be provided (productName, serialNumber, batchNumber, price)' });
    }
    
    // Validate price format
    if (isNaN(price) || Number(price) <= 0) {
      return res.status(400).json({ message: 'Price must be a valid positive number' });
    }

    // Validate batch
    const batch = await Batch.findOne({
      batchNumber,
      manufacturerId: req.user.userId,
    });

    if (!batch) {
      return res.status(404).json({ message: 'Batch not found or not owned by manufacturer' });
    }

    if (batch.quantityAvailable < 1) {
      return res.status(400).json({ message: 'No available quantity in batch' });
    }

    const manufacturer = await Manufacturer.findOne({ user: req.user.userId });

    if (!manufacturer) {
      return res.status(400).json({ message: "Manufacturer not found" });
    }

    // Generate QR Code
    const qrData = {
      serialNumber,
      batchNumber,
      productName,
      manufacturer: manufacturer.companyName,
      manufactureDate: batch.manufactureDate,
      expiryDate: batch.expiryDate
    };
    const qrCodeUrl = await QRCode.toDataURL(JSON.stringify(qrData));

    // Create fingerprint without blockchain
    const fingerprint = require('crypto')
      .createHash('sha256')
      .update(serialNumber + batchNumber + new Date().toISOString())
      .digest('hex');

    // Update batch quantity
    batch.quantityAvailable -= 1;
    await batch.save();

    // Save product to MongoDB with additional blockchain data
    const newProduct = await Product.create({
      manufacturerId: req.user.userId,
      batchId: batch._id,
      productName,
      serialNumber,
      batchNumber,
      manufactureDate: batch.manufactureDate,
      expiryDate: batch.expiryDate,
      manufacturerName: manufacturer.companyName,
      manufacturerLicense: batch.approvalCertId || '',
      productionLocation: batch.productionLocation || '',
      drugCode: drugCode || '',
      dosageForm: batch.dosageForm || '',
      strength: batch.strength,
      storageCondition: batch.storageConditions || '',
      approvalCertId: batch.approvalCertId,
      manufacturerCountry: 'Nepal',
      fingerprint,
      qrCodeUrl,
      
      price: price
    });

    res.status(201).json({
      message: 'Product registered successfully',
      product: newProduct,
      qrCodeUrl,
      fingerprint: newProduct.fingerprint,
      registrationTimestamp: new Date().toISOString(),
      serialNumber
    });

  } catch (error) {
    console.error('Product registration error:', error);
    
    // More detailed error handling
    if (error.code === 'CALL_EXCEPTION') {
      return res.status(400).json({
        message: 'Smart contract call failed',
        details: error.reason || error.message,
      });
    } else if (error.code === 'INSUFFICIENT_FUNDS') {
      return res.status(400).json({
        message: 'Insufficient funds for transaction',
        details: 'Please ensure the wallet has enough ETH for gas fees',
      });
    }
    
    return res.status(500).json({
      message: 'Failed to register product',
      details: error.message,
    });
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
      // manufacturerCountry: productToUse[13],                    // 'Nepal' (index 13, not 14!)
      manufacturerAddress: productToUse[13],                    // '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199' (index 14, not 15!)
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


const getManufacturerProducts = async (req, res) => {
  try {
    // Check authentication
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Convert userId to ObjectId
    let manufacturerId;
    try {
      manufacturerId = new mongoose.Types.ObjectId(req.user.userId);
    } catch (error) {
      console.error('Invalid manufacturerId format:', req.user.userId);
      return res.status(400).json({ message: 'Invalid manufacturer ID format' });
    }
    console.log("manufacturerId:", manufacturerId.toString());

    // Debug: Check if products exist for this manufacturer
    const productsCheck = await Product.find({ manufacturerId });
    console.log("Products found:", productsCheck.length);

    // Debug: Check if batches exist
    const batchesCheck = await Batch.find({});
    console.log("Batches found:", batchesCheck.length);

    // Aggregate to get one product per batch
    const products = await Product.aggregate([
      {
        $match: {
          manufacturerId: manufacturerId
        }
      },
      {
        $group: {
          _id: "$batchId",
          product: { $first: "$$ROOT" } // Take the first product for each batch
        }
      },
      {
        $lookup: {
          from: 'batches',
          localField: '_id',
          foreignField: '_id',
          as: 'batch'
        }
      },
      {
        $unwind: {
          path: '$batch',
          preserveNullAndEmptyArrays: true // Allow products without matching batches
        }
      },
      {
        $project: {
          id: '$product._id',
          name: '$product.productName',
          serialNumber: '$product.serialNumber',
          batchNumber: '$product.batchNumber',
          manufactureDate: {
            $dateToString: { format: "%Y-%m-%d", date: "$product.manufactureDate" }
          },
          expiryDate: {
            $dateToString: { format: "%Y-%m-%d", date: "$product.expiryDate" }
          },
          location: '$product.productionLocation',
          status: {
            $cond: {
              if: '$batch.shipmentStatus',
              then: { $toLower: { $trim: { input: "$batch.shipmentStatus" } } },
              else: 'unknown'
            }
          }
        }
      }
    ]);

    console.log("Aggregated products:", products);
    res.status(200).json(products);
  } catch (error) {
    console.error('Error fetching manufacturer products:', error);
    res.status(500).json({
      message: 'Error fetching products',
      error: error.message
    });
  }
};


const getManufacturerBatches = async (req, res) => {
  try {
    // First get all batches for the manufacturer
    const batches = await Batch.find({ manufacturerId: req.user.userId })
      .sort('-createdAt');

    // For each batch, get its products
    const batchesWithProducts = await Promise.all(batches.map(async (batch) => {
      const products = await Product.find({ 
        manufacturerId: req.user.userId,
        batchNumber: batch.batchNumber 
      }).sort('-createdAt');

      return {
        _id: batch._id,
        batchNumber: batch.batchNumber,
        manufactureDate: batch.manufactureDate,
        expiryDate: batch.expiryDate,
        quantityProduced: batch.quantityProduced,
        quantityAvailable: batch.quantityAvailable,
        dosageForm: batch.dosageForm,
        strength: batch.strength,
        storageConditions: batch.storageConditions,
        productionLocation: batch.productionLocation,
        shipmentStatus: batch.shipmentStatus,
        products: products.map(product => ({
          _id: product._id,
          productName: product.productName,
          serialNumber: product.serialNumber,
          drugCode: product.drugCode,
          price: product.price,
          qrCodeUrl: product.qrCodeUrl,
          fingerprint: product.fingerprint,
          status: product.status || 'produced'
        }))
      };
    }));

    res.json(batchesWithProducts);
  } catch (error) {
    console.error('Error fetching batches:', error);
    res.status(500).json({ message: 'Failed to fetch batches', error: error.message });
  }
};

module.exports = { 
  registerProduct, 
  getProductOnChain, 
  debugBlockchainConnection, 
  getManufacturerProducts,
  getManufacturerBatches 
};