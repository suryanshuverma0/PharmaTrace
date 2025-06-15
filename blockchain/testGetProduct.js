const { ethers } = require("hardhat");

async function main() {
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // deployed contract

  const ProductRegistry = await ethers.getContractFactory("ProductRegistry");
  const contract = ProductRegistry.attach(contractAddress);

  const serialNumber = "SN123456";

  const product = await contract.products(serialNumber);
  console.log(product);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
