const Batch = require("../models/Batch");
const { ethers } = require("ethers"); // Re-enabled for blockchain integration
const { signer, batchContract, provider } = require("../utils/blockchain"); // Re-enabled for blockchain integration
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

    // Get manufacturer details
    const manufacturer = await Manufacturer.findOne({ user: req.user.userId });
    if (!manufacturer) {
      return res.status(400).json({ message: "Manufacturer not found" });
    }

    // Function to parse storage conditions and extract environmental data
    const parseStorageConditions = (storageConditions) => {
      if (!storageConditions) {
        return {
          temperature: '25°C',
          humidity: '60%',
          status: 'Normal'
        };
      }

      // Extract temperature from storage conditions
      const tempMatch = storageConditions.match(/(\d+)°?\s*c/i);
      const temperature = tempMatch ? `${tempMatch[1]}°C` : '25°C';
      
      // Determine status based on temperature
      const tempValue = tempMatch ? parseInt(tempMatch[1]) : 25;
      let status = 'Normal';
      
      if (tempValue > 30) {
        status = 'Warning';
      } else if (tempValue > 40) {
        status = 'Critical';
      }

      // Extract humidity if mentioned, otherwise default
      const humidityMatch = storageConditions.match(/(\d+)%?\s*humid/i);
      const humidity = humidityMatch ? `${humidityMatch[1]}%` : '60%';

      return {
        temperature,
        humidity,
        status
      };
    };

    // Generate digital fingerprint for the batch using more comprehensive data
    const digitalFingerprint = require('crypto')
      .createHash('sha256')
      .update(batchNumber + manuDate.toISOString() + expDate.toISOString() + manufacturer.companyName + quantityProduced)
      .digest('hex');

    // Parse environmental conditions from storage conditions
    const environmentalConditions = parseStorageConditions(storageConditions);

    console.log("Starting blockchain registration for batch:", batchNumber);

    // Store batch on blockchain first (using simplified interface)
    const tx = await batchContract.registerBatch(
      batchNumber,
      Math.floor(manuDate.getTime() / 1000), // Convert to Unix timestamp
      Math.floor(expDate.getTime() / 1000),  // Convert to Unix timestamp
      quantityProduced,
      dosageForm,
      strength,
      manufacturer.companyName
    );

    console.log("Blockchain transaction sent, waiting for confirmation...");
    const receipt = await tx.wait();
    
    if (receipt.status !== 1) {
      throw new Error('Blockchain transaction failed');
    }

    console.log("Blockchain transaction confirmed:", receipt.hash);

    // Get the blockchain-generated fingerprint
    let blockchainFingerprint;
    try {
      blockchainFingerprint = await batchContract.getFingerprintByBatch(batchNumber);
      console.log("Blockchain-generated batch fingerprint:", blockchainFingerprint);
    } catch (fingerprintError) {
      console.warn("Could not get blockchain batch fingerprint, using local:", fingerprintError.message);
      blockchainFingerprint = digitalFingerprint; // fallback to local fingerprint
    }

    // Create new batch in database with blockchain data
    const batch = new Batch({
      manufacturerId: req.user.userId,
      batchNumber,
      manufactureDate: manuDate,
      expiryDate: expDate,
      quantityProduced,
      quantityAvailable: quantityProduced, // Available for individual product registration
      quantityAssigned: 0, // Initially no quantity assigned to distributors
      dosageForm,
      strength,
      storageConditions: storageConditions || '',
      productionLocation: productionLocation || '',
      approvalCertId: approvalCertId || '',
      digitalFingerprint: blockchainFingerprint, // Use blockchain fingerprint
      // Blockchain transaction details
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      blockHash: receipt.blockHash,
      gasUsed: receipt.gasUsed.toString(),
      contractAddress: batchContract.address,
      manufacturerAddress: await signer.getAddress(),
      blockchainVerified: true,
      // Initial shipment status
      shipmentStatus: 'Produced',
    });

    await batch.save();

    res.status(201).json({ 
      message: "Batch registered successfully", 
      batch: batch.toObject()
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
      "batchNumber dosageForm strength manufactureDate expiryDate quantityProduced quantityAvailable quantityAssigned approvalCertId storageConditions productionLocation shipmentStatus"
    );

    // Add calculated fields
    const batchesWithCalculatedFields = batches.map(batch => ({
      ...batch.toObject(),
      quantityRemainingForAssignment: Math.max(0, batch.quantityProduced - (batch.quantityAssigned || 0)),
      totalProductsRegistered: batch.quantityProduced - batch.quantityAvailable
    }));

    res.status(200).json({ batches: batchesWithCalculatedFields });
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
      $expr: { 
        $gt: [
          { $subtract: ['$quantityProduced', { $ifNull: ['$quantityAssigned', 0] }] }, 
          0
        ] 
      }
    }).select(
      "batchNumber dosageForm strength manufactureDate expiryDate quantityProduced quantityAvailable quantityAssigned approvalCertId storageConditions productionLocation shipmentStatus"
    );

    // Add calculated fields
    const batchesWithCalculatedFields = batches.map(batch => ({
      ...batch.toObject(),
      quantityRemainingForAssignment: Math.max(0, batch.quantityProduced - (batch.quantityAssigned || 0)),
      totalProductsRegistered: batch.quantityProduced - batch.quantityAvailable
    }));

    res.status(200).json({ batches: batchesWithCalculatedFields });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch available batches",
      details: error.message,
    });
  }
};

const getAvailableBatchesForProducts = async (req, res) => {
  try {
    const batches = await Batch.find({
      manufacturerId: req.user.userId,
      quantityAvailable: { $gt: 0 }
    }).select(
      "batchNumber dosageForm strength manufactureDate expiryDate quantityProduced quantityAvailable quantityAssigned approvalCertId storageConditions productionLocation shipmentStatus"
    );

    // Add calculated fields
    const batchesWithCalculatedFields = batches.map(batch => ({
      ...batch.toObject(),
      quantityRemainingForAssignment: Math.max(0, batch.quantityProduced - (batch.quantityAssigned || 0)),
      totalProductsRegistered: batch.quantityProduced - batch.quantityAvailable
    }));

    res.status(200).json({ batches: batchesWithCalculatedFields });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch batches available for products",
      details: error.message,
    });
  }
};

const assignBatchToDistributor = async (req, res) => {
  const { batchId } = req.params;
  const { to, remarks, status = "In Transit", quantity } = req.body;

  if (!to || !quantity) {
    return res.status(400).json({ message: "Distributor address and quantity are required" });
  }

  try {
    // Get the batch using batchNumber with findOneAndUpdate to ensure atomicity
    const batch = await Batch.findOne({ batchNumber: batchId });
    if (!batch) {
      throw new Error("Batch not found");
    }

    // Check if quantity is available for assignment (should be based on quantityProduced - quantityAssigned)
    const remainingForAssignment = batch.quantityProduced - (batch.quantityAssigned || 0);
    if (remainingForAssignment < quantity) {
      throw new Error(`Insufficient quantity available for assignment. Only ${remainingForAssignment} units left`);
    }

    // Get manufacturer details
    const manufacturer = await Manufacturer.findOne({ user: req.user.userId });
    if (!manufacturer) {
      throw new Error("Manufacturer not found");
    }

    // Get distributor details - first find the user by wallet address
    const distributorUser = await User.findOne({ address: to });
    if (!distributorUser) {
      throw new Error("Distributor wallet address not found");
    }

    // Then find the distributor by user ID
    const distributor = await Distributor.findOne({ user: distributorUser._id });
    if (!distributor) {
      throw new Error("Distributor not found for the given wallet address");
    }

    // Check if product associated with batch exists
    const product = await Product.findOne({ batchNumber: batch.batchNumber });
    if (!product) {
      throw new Error("Cannot assign batch without associated product");
    }

    // Prepare shipment entry
      const shipmentEntry = {
        timestamp: new Date(),
        from: manufacturer.companyName,
        fromAddress: manufacturer.user?.address || '',
        to: distributor.companyName,
        toAddress: distributorUser.address,
        status,
        quantity: quantity.toString(),
        remarks,
        actor: req.body.actor || {
          name: manufacturer.companyName,
          type: "Manufacturer",
          license: manufacturer.licenseNumber,
          location: manufacturer.address
        },
        environmentalConditions: req.body.environmentalConditions || {
          temperature: "25°C",
          humidity: "60%",
          status: "Normal"
        },
        qualityCheck: req.body.qualityCheck || {
          performedBy: req.user.name,
          date: new Date(),
          result: "Pass",
          notes: "Quality check passed before shipment"
        },
        verifiedBy: {
          user: req.user.userId,
          timestamp: new Date(),
          role: "Manufacturer"
        }
      };

      // Update batch shipment history on blockchain first
      try {
        // Get manufacturer's blockchain address
        const manufacturerAddress = manufacturer.user?.address || await signer.getAddress() || '';
        
        // Ensure we have valid addresses for blockchain
        const fromAddress = manufacturerAddress;
        const toAddress = distributorUser.address;
        
        console.log("📦 Adding shipment entry to blockchain:", {
          batchNumber: batch.batchNumber,
          from: shipmentEntry.from,
          to: shipmentEntry.to,
          fromAddress,
          toAddress,
          status: shipmentEntry.status,
          quantity: parseInt(shipmentEntry.quantity),
          remarks: shipmentEntry.remarks || ''
        });
        
        const blockchainShipmentTx = await batchContract.addShipmentEntry(
          batch.batchNumber,
          shipmentEntry.from,
          shipmentEntry.to,
          fromAddress,
          toAddress,
          shipmentEntry.status,
          parseInt(shipmentEntry.quantity),
          shipmentEntry.remarks || ''
        );
        
        console.log("Blockchain shipment transaction sent, waiting for confirmation...");
        const shipmentReceipt = await blockchainShipmentTx.wait();
        
        if (shipmentReceipt.status !== 1) {
          throw new Error("Blockchain shipment transaction failed");
        }
        
        console.log("✅ Blockchain shipment transaction confirmed:", shipmentReceipt.hash);
        console.log("📋 Gas used:", shipmentReceipt.gasUsed.toString());
        
        // Add blockchain transaction hash to shipment entry
        shipmentEntry.txHash = shipmentReceipt.hash;
        shipmentEntry.blockNumber = shipmentReceipt.blockNumber;
        
        // Verify the shipment was added by checking history length
        try {
          const historyLength = await batchContract.getBatchShipmentHistoryLength(batch.batchNumber);
          console.log("📊 Blockchain shipment history length after addition:", historyLength.toString());
        } catch (verifyError) {
          console.log("⚠️ Could not verify shipment history length:", verifyError.message);
        }
        
      } catch (blockchainError) {
        console.error("❌ Blockchain shipment update failed:", blockchainError);
        console.error("Error details:", {
          code: blockchainError.code,
          reason: blockchainError.reason,
          message: blockchainError.message
        });
        
        // Continue with database update even if blockchain fails (can be synced later)
        shipmentEntry.blockchainError = blockchainError.message;
      }

      // Update batch with shipment history, status, and assigned quantity in MongoDB
      const updatedBatch = await Batch.findOneAndUpdate(
        { batchNumber: batchId },
        { 
          $set: {
            shipmentStatus: status,
            quantityAssigned: (batch.quantityAssigned || 0) + quantity,
            updatedAt: new Date()
          },
          $push: { shipmentHistory: shipmentEntry }
        },
        { new: true }
      );

      if (!updatedBatch) {
        throw new Error("Failed to update batch. Quantity may have changed.");
      }

      res.status(200).json({
        message: "Batch assigned successfully",
        assignment: {
          batchNumber: updatedBatch.batchNumber,
          productName: product.productName,
          productDetails: `${updatedBatch.dosageForm} ${updatedBatch.strength}`,
          distributor: distributor.companyName,
          distributorWallet: distributorUser.address,
          quantity,
          remarks,
          assignedAt: new Date(),
          shipmentStatus: updatedBatch.shipmentStatus,
          shipmentEntry
        }
      });
    
  } catch (error) {
    console.error("Assign Batch Error:", error);
    return res.status(400).json({ 
      message: error.message || "Failed to assign batch",
      error: error.message 
    });
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
  getAvailableBatchesForProducts,
  assignBatchToDistributor,
  getRecentlyAssignedBatches
};

