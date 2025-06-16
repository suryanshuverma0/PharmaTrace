// scripts/debugContractMethods.js
const { ethers } = require("ethers");
const abi = require("../artifacts/contracts/ProductRegistry.sol/ProductRegistry.json").abi;

const provider = new ethers.JsonRpcProvider("http://localhost:8545");
const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

// Test with both provider and signer
const signer = new ethers.Wallet("0xdf57089febbacf7ba0bc227dafbffa9fc08a93fdc68e1e42411a14efcf23656e", provider);

const contractWithProvider = new ethers.Contract(contractAddress, abi, provider);
const contractWithSigner = new ethers.Contract(contractAddress, abi, signer);

const serialNumber = "SNBLK32";

async function main() {
  try {
    console.log("=== Testing Contract Methods ===");
    console.log("Serial Number:", serialNumber);
    console.log("Contract Address:", contractAddress);
    console.log("Signer Address:", signer.address);
    
    // Method 1: Using provider
    console.log("\n=== Method 1: Using Provider ===");
    const productWithProvider = await contractWithProvider.products(serialNumber);
    console.log("Product with provider:", productWithProvider);
    
    // Method 2: Using signer
    console.log("\n=== Method 2: Using Signer ===");
    const productWithSigner = await contractWithSigner.products(serialNumber);
    console.log("Product with signer:", productWithSigner);
    
    // Method 3: Using call
    console.log("\n=== Method 3: Using Call ===");
    try {
      const productWithCall = await contractWithProvider.products.staticCall(serialNumber);
      console.log("Product with call:", productWithCall);
    } catch (err) {
      console.log("Call method failed:", err.message);
    }
    
    // Method 4: Raw call
    console.log("\n=== Method 4: Raw Call ===");
    try {
      const iface = new ethers.Interface(abi);
      const data = iface.encodeFunctionData("products", [serialNumber]);
      const result = await provider.call({
        to: contractAddress,
        data: data
      });
      const decoded = iface.decodeFunctionResult("products", result);
      console.log("Raw call result:", decoded);
    } catch (err) {
      console.log("Raw call failed:", err.message);
    }
    
    // Method 5: Check if it's a view function issue
    console.log("\n=== Method 5: Contract Info ===");
    const code = await provider.getCode(contractAddress);
    console.log("Contract has code:", code !== "0x");
    
    const network = await provider.getNetwork();
    console.log("Network:", network.chainId.toString());
    
  } catch (error) {
    console.error("Error:", error);
  }
}

main().catch(console.error);