async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  const ProductRegistryFactory = await ethers.getContractFactory("ProductRegistry");
  const BatchRegistryFactory = await ethers.getContractFactory("BatchRegistry");

  const productRegistry = await ProductRegistryFactory.deploy();
  const batchRegistry = await BatchRegistryFactory.deploy();

  await productRegistry.waitForDeployment();  
  await batchRegistry.waitForDeployment();  


  console.log("ProductRegistry deployed to:", await productRegistry.getAddress());
  console.log("BatchRegistry deployed to:", await batchRegistry.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
