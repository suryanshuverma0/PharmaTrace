const Batch = require("../models/Batch");
const { ethers } = require("ethers");
const { signer, batchContract, provider } = require("../utils/blockchain");
const Manufacturer = require("../models/Manufacturer");
const Product = require("../models/Product");
const Distributor = require("../models/Distributor");
const User = require("../models/User");
const mongoose = require("mongoose");


const registerBatch = async (req, res) => {
  const {
    batchNumber,
    manufactureDate,
    expiryDate,
    quantityProduced,
    dosageForm,
    strength,
    storageConditions,
    productionLocation,
    approvalCertId,
  } = req.body;

  try {
    // Validate required fields
    if (!batchNumber || !manufactureDate || !expiryDate || !quantityProduced || !dosageForm || !strength) {
      return res.status(400).json({ 
        message: "All required fields (batchNumber, manufactureDate, expiryDate, quantityProduced, dosageForm, strength) must be provided" 
      });
    }

    // Validate batchNumber format (alphanumeric)
    if (!/^[A-Za-z0-9]+$/.test(batchNumber)) {
      return res.status(400).json({ message: "Batch number must be alphanumeric" });
    }

    // Validate quantityProduced
    if (!Number.isInteger(Number(quantityProduced)) || quantityProduced <= 0) {
      return res.status(400).json({ message: "Quantity produced must be a positive integer" });
    }

    // Validate dates
    const manuDate = new Date(manufactureDate);
    const expDate = new Date(expiryDate);
    if (isNaN(manuDate.getTime()) || isNaN(expDate.getTime())) {
      return res.status(400).json({ message: "Invalid date format for manufacture or expiry date" });
    }
    if (expDate <= manuDate) {
      return res.status(400).json({ message: "Expiry date must be after manufacture date" });
    }

    // Check if batchNumber is unique in database
    const existingBatch = await Batch.findOne({ batchNumber });
    if (existingBatch) {
      return res.status(400).json({ message: "Batch number already exists" });
    }

    // Validate signer
    if (!signer.address) {
      return res.status(500).json({ message: 'Server error: Signer address is not available' });
    }

    // Get manufacturer details
    const manufacturer = await Manufacturer.findOne({ user: req.user.userId });
    if (!manufacturer) {
      return res.status(400).json({ message: "Manufacturer not found" });
    }

    // Register batch on blockchain first
    console.log('Registering batch on blockchain...');
    const tx = await batchContract.registerBatch(
      batchNumber,
      Math.floor(manuDate.getTime() / 1000), // Convert to Unix timestamp
      Math.floor(expDate.getTime() / 1000),   // Convert to Unix timestamp
      quantityProduced,
      dosageForm,
      strength,
      storageConditions || '',
      productionLocation || '',
      approvalCertId || '',
      manufacturer.companyName || 'Company Name',
      'Nepal'
    );

    console.log('Waiting for blockchain confirmation...');
    const receipt = await tx.wait();

    console.log("Batch registration receipt:", receipt);

    // Check transaction status
    if (receipt.status !== 1) {
      throw new Error('Blockchain transaction failed');
    }

    // Generate digital fingerprint for the batch
    const digitalFingerprint = ethers.keccak256(
      ethers.toUtf8Bytes(batchNumber + manuDate.toISOString() + expDate.toISOString())
    );

    // Create new batch in database with blockchain data
    const batch = new Batch({
      manufacturerId: req.user.userId,
      batchNumber,
      manufactureDate: manuDate,
      expiryDate: expDate,
      quantityProduced,
      quantityAvailable: quantityProduced,
      dosageForm,
      strength,
      storageConditions: storageConditions || '',
      productionLocation: productionLocation || '',
      approvalCertId: approvalCertId || '',
      digitalFingerprint,
      
      // Blockchain transaction details
      txHash: receipt.hash,
      blockNumber: Number(receipt.blockNumber),
      blockHash: receipt.blockHash,
      gasUsed: receipt.gasUsed.toString(),
      contractAddress: receipt.to,
      manufacturerAddress: signer.address,
    });

    await batch.save();

    res.status(201).json({ 
      message: "Batch registered successfully on blockchain and database", 
      batch: {
        ...batch.toObject(),
        blockchain: {
          txHash: receipt.hash,
          blockNumber: Number(receipt.blockNumber),
          blockHash: receipt.blockHash,
          gasUsed: receipt.gasUsed.toString(),
          contractAddress: receipt.to,
          status: receipt.status === 1 ? 'success' : 'failed',
          registrationTimestamp: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    console.error('Batch registration error:', error);
    
    // Enhanced error handling for blockchain-specific errors
    if (error.code === 'CALL_EXCEPTION') {
      return res.status(400).json({
        message: 'Smart contract call failed',
        details: error.reason || error.message,
      });
    } else if (error.code === 'INSUFFICIENT_FUNDS') {
      return res.status(400).json({
        message: 'Insufficient funds for blockchain transaction',
        details: 'Please ensure the wallet has enough ETH for gas fees',
      });
    } else if (error.message && error.message.includes('Batch already exists')) {
      return res.status(400).json({
        message: 'Batch already exists on blockchain',
        details: 'This batch number has already been registered on the blockchain',
      });
    }
    
    return res.status(500).json({
      message: "Failed to register batch",
      details: error.message,
    });
  }
};

// Additional controller to update batch quantity when products are created
const updateBatchQuantity = async (batchNumber, newQuantityAvailable) => {
  try {
    // Update quantity on blockchain
    const tx = await batchContract.updateBatchQuantity(batchNumber, newQuantityAvailable);
    const receipt = await tx.wait();
    
    if (receipt.status !== 1) {
      throw new Error('Failed to update batch quantity on blockchain');
    }
    
    console.log(`Batch ${batchNumber} quantity updated on blockchain. TX: ${receipt.hash}`);
    return receipt;
  } catch (error) {
    console.error('Error updating batch quantity on blockchain:', error);
    throw error;
  }
};

// Controller to get batch information from blockchain
const getBatchFromBlockchain = async (req, res) => {
  try {
    const { batchNumber } = req.params;
    
    if (!batchNumber) {
      return res.status(400).json({ message: 'Batch number is required' });
    }
    
    // Get batch from blockchain
    const blockchainBatch = await batchContract.getBatch(batchNumber);
    
    // Also get from database for comparison
    const dbBatch = await Batch.findOne({ batchNumber });
    
    res.status(200).json({
      blockchain: {
        batchNumber: blockchainBatch.batchNumber,
        manufactureDate: new Date(Number(blockchainBatch.manufactureDate) * 1000),
        expiryDate: new Date(Number(blockchainBatch.expiryDate) * 1000),
        quantityProduced: Number(blockchainBatch.quantityProduced),
        quantityAvailable: Number(blockchainBatch.quantityAvailable),
        dosageForm: blockchainBatch.dosageForm,
        strength: blockchainBatch.strength,
        storageConditions: blockchainBatch.storageConditions,
        productionLocation: blockchainBatch.productionLocation,
        approvalCertId: blockchainBatch.approvalCertId,
        manufacturerName: blockchainBatch.manufacturerName,
        manufacturerAddress: blockchainBatch.manufacturerAddress,
        registrationTimestamp: new Date(Number(blockchainBatch.registrationTimestamp) * 1000),
        isActive: blockchainBatch.isActive
      },
      database: dbBatch
    });
    
  } catch (error) {
    console.error('Error fetching batch from blockchain:', error);
    return res.status(500).json({
      message: 'Failed to fetch batch information',
      details: error.message
    });
  }
};



const getBatches = async (req, res) => {
  try {
    const batches = await Batch.find({ manufacturerId: req.user.userId }).select(
      "batchNumber dosageForm strength manufactureDate expiryDate quantityProduced quantityAvailable approvalCertId storageConditions productionLocation shipmentStatus"
    );
    res.status(200).json({ batches });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch batches",
      details: error.message,
    });
  }
};

const getAvailableBatches = async (req, res) => {
  try {
    const batches = await Batch.find({
      manufacturerId: req.user.userId,
      quantityAvailable: { $gt: 0 }, 
    }).select(
      "batchNumber dosageForm strength manufactureDate expiryDate quantityProduced quantityAvailable approvalCertId storageConditions productionLocation shipmentStatus"
    );

    res.status(200).json({ batches });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch batches",
      details: error.message,
    });
  }
};

const assignBatchToDistributor = async (req, res) => {
  const { batchId } = req.params;
  const { to, remarks, status = "In Transit", txHash, quantity } = req.body;
  console.log("User in request:", req.user);


  if (!to || !quantity) {
    return res.status(400).json({ message: "Distributor address and quantity are required" });
  }

  try {
    const batch = await Batch.findById(batchId);
    if (!batch) {
      return res.status(404).json({ message: "Batch not found" });
    }

    // Check if product associated with batch exists
    const product = await Product.findOne({ batchId: batch._id });
    if (!product) {
      return res.status(400).json({ message: "Cannot assign batch without associated product" });
    }

    // Note: quantityAvailable NOT reduced here
    // Append to shipmentHistory with quantity
    batch.shipmentHistory.push({
      from: req?.user?.address,
      to,
      status,
      remarks,
      txHash,
      quantity,
    });

    batch.shipmentStatus = status;
    batch.updatedAt = new Date();

    await batch.save();

    res.status(200).json({ message: "Batch assigned successfully", data: batch });
  } catch (error) {
    console.error("Assign Batch Error:", error);
    res.status(500).json({ message: "Failed to assign batch", error: error.message });
  }
};


const getRecentlyAssignedBatches = async (req, res) => {
  try {
    const manufacturerId = req.user.userId;

    // Find batches with non-empty shipmentHistory
    const batches = await Batch.find({
      manufacturerId,
      shipmentHistory: { $exists: true, $ne: [] }
    })
      .sort({ updatedAt: -1 })
      .limit(10)
      .lean();

    const assignedData = [];

    for (const batch of batches) {
      const latestShipment = batch.shipmentHistory[batch.shipmentHistory.length - 1];

      // Defensive check if shipment exists
      if (!latestShipment) continue;

      // Fetch related product by batchId
      const product = await Product.findOne({ batchId: batch._id }).lean();

      // Find distributor user by wallet address in shipment 'to'
      const distributorUser = await User.findOne({ address: latestShipment.to }).lean();

      // Find distributor company by user id
      const distributor = distributorUser
        ? await Distributor.findOne({ user: distributorUser._id }).lean()
        : null;

      // Format assignedAt date safely
      const assignedAt = latestShipment.timestamp
        ? new Date(latestShipment.timestamp).toISOString().slice(0, 16).replace("T", " ")
        : "Unknown";

      assignedData.push({
        batchNumber: batch.batchNumber,
        productName: product?.productName || "Unknown",
        distributor: distributor?.companyName || "Unknown Distributor",
        distributorWallet: latestShipment.to,
        quantity: latestShipment.quantity || 0,
        remarks: latestShipment.remarks || "",
        assignedAt,
        shipmentStatus: batch.shipmentStatus
      });
    }

    res.status(200).json({ assignments: assignedData });
  } catch (error) {
    console.error("Error fetching recent assignments:", error);
    res.status(500).json({ message: "Failed to fetch recent assignments", error: error.message });
  }
};



module.exports = { 
  registerBatch, 
  updateBatchQuantity, 
  getBatchFromBlockchain ,
  getBatches,
  getAvailableBatches,
  assignBatchToDistributor,
  getRecentlyAssignedBatches
};

