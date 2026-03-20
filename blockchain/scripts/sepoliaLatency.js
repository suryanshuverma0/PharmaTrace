const { ethers } = require("hardhat");

async function measure(txPromise, label) {
  const start = Date.now();
  const tx = await txPromise;
  await tx.wait();
  const end = Date.now();
  console.log(label, ((end - start) / 1000).toFixed(2), "seconds");
}

async function main() {
  const Batch = await ethers.getContractFactory("BatchRegistry");
  const batch = await Batch.deploy();
  await batch.waitForDeployment();

  const Product = await ethers.getContractFactory("ProductRegistry");
  const product = await Product.deploy();
  await product.waitForDeployment();

  const now = Math.floor(Date.now() / 1000);

  await measure(
    batch.registerBatch(
      "SEP1",
      now - 1000,
      now + 100000,
      100,
      "Tablet",
      "500mg",
      "TestPharma"
    ),
    "Batch Registration:"
  );

  await measure(
    product.registerProduct(
      "Paracetamol",
      "SEP-P1",
      "SEP1",
      now,
      now + 100000,
      "TestPharma",
      "Tablet",
      "500mg"
    ),
    "Product Registration:"
  );

  await measure(
    batch.addShipmentEntry(
      "SEP1",
      "Manufacturer",
      "Distributor",
      ethers.ZeroAddress,
      ethers.ZeroAddress,
      "Shipped",
      50,
      "Sepolia shipment"
    ),
    "Shipment Update:"
  );
}

main().catch(console.error);