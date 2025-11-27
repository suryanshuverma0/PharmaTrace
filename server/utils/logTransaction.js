const fs = require("fs");
const path = require("path");
const { ethers } = require("ethers");

/**
 * Safely logs blockchain transaction info to console and stores in JSON.
 * Works even if gasUsed or effectiveGasPrice are undefined.
 */
const logBlockchainTransaction = async (tx, receipt, userAddress, role) => {
  try {
    if (!tx || !receipt) {
      console.error("❌ Transaction or receipt missing.");
      return;
    }

    // Safely read values with fallbacks
    const gasUsed =
      receipt.gasUsed && receipt.gasUsed.toString
        ? receipt.gasUsed.toString()
        : "0";

    const gasPrice =
      receipt.effectiveGasPrice && receipt.effectiveGasPrice.toString
        ? receipt.effectiveGasPrice.toString()
        : "0";

    let totalGasFeeETH = "0";
    try {
      // Compute gas * gasPrice safely
      const totalGas = BigInt(gasUsed) * BigInt(gasPrice);
      totalGasFeeETH = ethers.utils.formatEther(totalGas.toString());
    } catch {
      totalGasFeeETH = "0";
    }

    const txData = {
      userAddress: userAddress || "Unknown",
      role: role || "Unknown",
      txHash: tx.hash || "N/A",
      from: tx.from || "N/A",
      to: tx.to || "N/A",
      blockNumber: receipt.blockNumber || 0,
      gasUsed,
      effectiveGasPrice: gasPrice,
      totalGasFeeETH,
      status: receipt.status === 1 ? "Success" : "Failed",
      timestamp: new Date().toISOString(),
    };

    // 🎯 Clean console table
    console.log("\n========== 🧾 Blockchain Transaction Info ==========");
    console.table(txData);
    console.log("====================================================\n");

    // ✅ Create logs directory if missing
    const logsDir = path.join(__dirname, "../../logs");
    fs.mkdirSync(logsDir, { recursive: true });

    // ✅ Append transaction log
    const filePath = path.join(logsDir, "transactions.json");
    let existingLogs = [];

    if (fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, "utf8");
        existingLogs = JSON.parse(content);
      } catch {
        existingLogs = [];
      }
    }

    existingLogs.push(txData);

    fs.writeFileSync(filePath, JSON.stringify(existingLogs, null, 2));

  } catch (error) {
    console.error("❌ Error logging blockchain transaction:", error.message);
  }
};

module.exports = logBlockchainTransaction;
