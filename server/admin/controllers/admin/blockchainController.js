// controllers/admin/blockchainController.js
const { ethers } = require("ethers");
const User = require("../../../models/User");
const Batch = require("../../../models/Batch");
const Product = require("../../../models/Product");

// Import your initialized provider from your blockchain setup
const { provider } = require("../../../utils/blockchain"); 

// Map network to explorer URL
const NETWORK_EXPLORER = {
  sepolia: "https://sepolia.etherscan.io/tx/",
  mainnet: "https://etherscan.io/tx/",
};

// Helper: shorten txHash
const shortenTx = (txHash) =>
  txHash ? txHash.slice(0, 6) + "..." + txHash.slice(-4) : null;

// Helper: compute status
const computeStatus = async (txHash) => {
  if (!txHash) return "Unverified";
  try {
    const receipt = await provider.getTransactionReceipt(txHash);
    if (!receipt) return "Pending";
    return "Verified";
  } catch (err) {
    return "Error";
  }
};

// Helper: build row for frontend
const buildRow = (record, type) => {
  let row = {
    id: record._id,
    type,
    txHash: record.txHash || null,
    txShort: shortenTx(record.txHash),
    blockNumber: record.blockNumber || null,
    gasUsed: record.gasUsed || null,
    explorerUrl: record.txHash
      ? `${NETWORK_EXPLORER.sepolia}${record.txHash}`
      : null,
    status: record.blockchainVerified
      ? "Verified"
      : record.txHash
      ? "Pending"
      : "Unverified",
    createdAt: record.createdAt || record.updatedAt,
  };

  if (type === "users") {
    row.title = record.name || record.username || record.address;
    row.subTitle = record.role;
    row.wallet = record.address;
  } else if (type === "batches") {
    row.title = record.batchNumber;
    row.subTitle = record.productName;
    row.owner = record.manufacturerName || record.manufacturerAddress;
  } else if (type === "products") {
    row.title = record.productName;
    row.subTitle = record.serialNumber || record.batchNumber;
    row.owner = record.manufacturerName || record.manufacturerAddress;
  }

  return row;
};

// ===============================
// Controller: GET all txs
// ===============================
const getAllTxs = async (req, res) => {
  try {
    // Optional pagination (default limit 50)
    const limit = parseInt(req.query.limit) || 50;

    const users = await User.find({})
      .sort({ createdAt: -1 })
      .limit(limit);
    const batches = await Batch.find({})
      .sort({ createdAt: -1 })
      .limit(limit);
    const products = await Product.find({})
      .sort({ createdAt: -1 })
      .limit(limit);

    const userRows = users.map((u) => buildRow(u, "users"));
    const batchRows = batches.map((b) => buildRow(b, "batches"));
    const productRows = products.map((p) => buildRow(p, "products"));

    return res.json({
      success: true,
      data: {
        users: userRows,
        batches: batchRows,
        products: productRows,
      },
    });
  } catch (error) {
    console.error("getAllTxs error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ===============================
// Controller: GET tx details
// ===============================
const getTxDetails = async (req, res) => {
  try {
    const { type, id } = req.params;
    let record;

    if (type === "users") {
      record = await User.findById(id);
    } else if (type === "batches") {
      record = await Batch.findById(id);
    } else if (type === "products") {
      record = await Product.findById(id);
    } else {
      return res.status(400).json({ success: false, error: "Invalid type" });
    }

    if (!record) {
      return res
        .status(404)
        .json({ success: false, error: `${type} not found` });
    }

    const explorerUrl = record.txHash
      ? `${NETWORK_EXPLORER.sepolia}${record.txHash}`
      : null;

    return res.json({ success: true, record, explorerUrl });
  } catch (error) {
    console.error("getTxDetails error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ===============================
// Controller: Reverify single tx
// ===============================
const reverifyTx = async (req, res) => {
  try {
    const { type, id } = req.params;
    let Model;

    if (type === "users") Model = User;
    else if (type === "batches") Model = Batch;
    else if (type === "products") Model = Product;
    else return res.status(400).json({ success: false, error: "Invalid type" });

    const record = await Model.findById(id);
    if (!record) {
      return res.status(404).json({ success: false, error: `${type} not found` });
    }
    if (!record.txHash) {
      return res
        .status(400)
        .json({ success: false, error: "No txHash found for this record" });
    }

    const receipt = await provider.getTransactionReceipt(record.txHash);
    if (!receipt) {
      return res.json({ success: true, status: "Pending", message: "TX not mined yet" });
    }

    // Update DB fields
    record.blockNumber = receipt.blockNumber;
    record.blockHash = receipt.blockHash;
    record.gasUsed = receipt.gasUsed.toString();
    record.blockchainVerified = true;
    record.verifiedAt = new Date();

    await record.save();

    return res.json({ success: true, status: "Verified", receipt });
  } catch (error) {
    console.error("reverifyTx error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getAllTxs,
  getTxDetails,
  reverifyTx,
};
