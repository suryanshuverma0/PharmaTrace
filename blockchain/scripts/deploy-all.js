// scripts/deploy-all.js
const hre = require("hardhat");

async function main() {
  console.log("Starting deployment...");

  // Get the contract factories
  const ProductRegistry = await hre.ethers.getContractFactory(
    "ProductRegistry"
  );
  const BatchRegistry = await hre.ethers.getContractFactory("BatchRegistry");

  console.log("Deploying ProductRegistry...");
  const productRegistry = await ProductRegistry.deploy();
  await productRegistry.waitForDeployment();
  const productRegistryAddress = await productRegistry.getAddress();
  console.log("ProductRegistry deployed to:", productRegistryAddress);

  console.log("Deploying BatchRegistry...");
  const batchRegistry = await BatchRegistry.deploy();
  await batchRegistry.waitForDeployment();
  const batchRegistryAddress = await batchRegistry.getAddress();
  console.log("BatchRegistry deployed to:", batchRegistryAddress);

  const UserRegistry = await hre.ethers.getContractFactory("UserRegistry");
  console.log("Deploying UserRegistry...");
  const userRegistry = await UserRegistry.deploy();
  await userRegistry.waitForDeployment();
  const userRegistryAddress = await userRegistry.getAddress();
  console.log("UserRegistry deployed to:", userRegistryAddress);

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    ProductRegistry: {
      address: productRegistryAddress,
      deployer: (await hre.ethers.getSigners())[0].address,
    },
    BatchRegistry: {
      address: batchRegistryAddress,
      deployer: (await hre.ethers.getSigners())[0].address,
    },
    UserRegistry:{
      address: userRegistryAddress,
      deployer: (await hre.ethers.getSigners())[0].address
    },
    deploymentTime: new Date().toISOString(),
  };

  console.log("\n=== Deployment Summary ===");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // Save to file
  const fs = require("fs");
  fs.writeFileSync(
    "./deployment-info.json",
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("\nDeployment info saved to deployment-info.json");

  return deploymentInfo;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
