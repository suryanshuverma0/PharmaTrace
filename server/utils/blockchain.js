require("dotenv").config();

const { ethers } = require("ethers");

// Import ABIs for both contracts
const productContractABI =
  require("../../blockchain/artifacts/contracts/ProductRegistry.sol/ProductRegistry.json").abi;
const batchContractABI =
  require("../../blockchain/artifacts/contracts/BatchRegistry.sol/BatchRegistry.json").abi;

const userRegistryABI =
  require("../../blockchain/artifacts/contracts/UserRegistry.sol/UserRegistry.json").abi;
// Validate environment variables
if (!process.env.BLOCKCHAIN_RPC) {
  throw new Error("BLOCKCHAIN_RPC is not set in .env");
}
if (!process.env.PRIVATE_KEY) {
  throw new Error("PRIVATE_KEY is not set in .env");
}
if (!process.env.CONTRACT_ADDRESS) {
  throw new Error("CONTRACT_ADDRESS is not set in .env");
}
if (!process.env.BATCH_CONTRACT_ADDRESS) {
  throw new Error("BATCH_CONTRACT_ADDRESS is not set in .env");
}
if (!process.env.PRODUCT_CONTRACT_ADDRESS) {
  throw new Error("PRODUCT_CONTRACT_ADDRESS is not set in .env");
}

if (!process.env.USER_CONTRACT_ADDRESS) {
  throw new Error("USER_CONTRACT_ADDRESS is not set in .env");
}

// Initialize provider and signer
const provider = new ethers.JsonRpcProvider(
  process.env.BLOCKCHAIN_RPC,
  undefined,
  {
    ensNetwork: undefined,
  }
);

let signer;
try {
  signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
} catch (error) {
  throw new Error(`Failed to initialize signer: ${error.message}`);
}

// Initialize both contracts
const productContract = new ethers.Contract(
  process.env.PRODUCT_CONTRACT_ADDRESS,
  productContractABI,
  signer
);
const batchContract = new ethers.Contract(
  process.env.BATCH_CONTRACT_ADDRESS,
  batchContractABI,
  signer
);

const userRegistry = new ethers.Contract(
  process.env.USER_CONTRACT_ADDRESS,
  userRegistryABI,
  signer
);
async function testConnection() {
  try {
    // Test network connection
    const network = await provider.getNetwork();
    console.log("✅ Connected to network:", network.chainId.toString());

    // Test signer balance
    const balance = await provider.getBalance(signer.address);
    console.log("✅ Signer balance:", ethers.formatEther(balance), "ETH");

    // Test Product contract deployment
    const productCode = await provider.getCode(process.env.CONTRACT_ADDRESS);
    console.log("✅ Product Contract deployed:", productCode !== "0x");

    // Test Batch contract deployment
    const batchCode = await provider.getCode(
      process.env.BATCH_CONTRACT_ADDRESS
    );
    console.log("✅ Batch Contract deployed:", batchCode !== "0x");

    // Test Product contract interaction
    try {
      const testProduct = await productContract.products("SNBLK32");
      console.log(
        "✅ Product Contract call successful, product data:",
        testProduct
      );
    } catch (contractError) {
      console.warn(
        "⚠️ Product Contract call failed, may be expected if no product exists:",
        contractError.message
      );
    }

    // Test Batch contract interaction
    try {
      const totalBatches = await batchContract.getTotalBatches();
      console.log(
        "✅ Batch Contract call successful, total batches:",
        totalBatches.toString()
      );
    } catch (contractError) {
      console.warn("⚠️ Batch Contract call failed:", contractError.message);
    }

    try {
      const admin = await userRegistry.admin();
      console.log("✅ UserRegistry admin:", admin);

      // Use a sample address from Hardhat accounts
      const testUser = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
      const RoleEnum = { None: 0, Superadmin: 1, Manufacturer: 2, Distributor: 3, Pharmacist: 4 };
      const tx = await userRegistry.setUser(testUser, true, RoleEnum.Manufacturer); // or appropriate role

      await tx.wait();
      const isApproved = await userRegistry.isUserApproved(testUser);
      console.log(`✅ User ${testUser} approved?`, isApproved);
    } catch (err) {
      console.warn("⚠️ UserRegistry test failed:", err.message);
    }
  } catch (error) {
    console.error(
      "❌ Blockchain connection test failed:",
      error.message,
      error.stack
    );
  }
}

// Run test connection after a delay
setTimeout(testConnection, 1000);

// Export both contracts with clear naming
module.exports = {
  // Product-related exports (maintaining backward compatibility)
  contract: productContract,
  signer,
  provider,

  // Explicit exports for better clarity
  productContract,
  batchContract,
  userRegistry,
};
