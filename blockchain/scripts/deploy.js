async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  const ProductRegistryFactory = await ethers.getContractFactory("ProductRegistry");
  const productRegistry = await ProductRegistryFactory.deploy();

  await productRegistry.waitForDeployment();  // <--- use this instead of `.deployed()`

  console.log("ProductRegistry deployed to:", await productRegistry.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
