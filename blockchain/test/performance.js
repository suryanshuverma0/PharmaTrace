const { ethers } = require("hardhat");

describe("Performance Evaluation with Latency", function () {
  let batchRegistry, productRegistry;

  async function measureLatency(fn) {
    const start = Date.now();
    const tx = await fn();
    await tx.wait();
    const end = Date.now();
    return (end - start) / 1000; // seconds
  }

  before(async function () {
    const Batch = await ethers.getContractFactory("BatchRegistry");
    batchRegistry = await Batch.deploy();
    await batchRegistry.waitForDeployment();

    const Product = await ethers.getContractFactory("ProductRegistry");
    productRegistry = await Product.deploy();
    await productRegistry.waitForDeployment();
  });

  it("Measure Latency of Core Operations", async function () {
    let batchTimes = [];
    let productTimes = [];
    let shipmentTimes = [];
    let distributorTimes = [];
    let pharmacistTimes = [];

    for (let i = 0; i < 5; i++) {

      batchTimes.push(await measureLatency(() =>
        batchRegistry.registerBatch(
          "B00" + i,
          Math.floor(Date.now()/1000) - 1000,
          Math.floor(Date.now()/1000) + 100000,
          100,
          "Tablet",
          "500mg",
          "TestPharma"
        )
      ));

      productTimes.push(await measureLatency(() =>
        productRegistry.registerProduct(
          "Paracetamol",
          "S00" + i,
          "B00" + i,
          0,
          9999999,
          "TestPharma",
          "Tablet",
          "500mg"
        )
      ));

      shipmentTimes.push(await measureLatency(() =>
        batchRegistry.addShipmentEntry(
          "B00" + i,
          "Manufacturer",
          "Distributor",
          ethers.ZeroAddress,
          ethers.ZeroAddress,
          "Shipped",
          50,
          "Shipment"
        )
      ));

      distributorTimes.push(await measureLatency(() =>
        batchRegistry.verifyByDistributor("B00" + i)
      ));

      pharmacistTimes.push(await measureLatency(() =>
        batchRegistry.verifyByPharmacist("B00" + i)
      ));
    }

    function average(arr) {
      return arr.reduce((a,b)=>a+b,0)/arr.length;
    }

    console.log("Average Batch Registration Time:", average(batchTimes));
    console.log("Average Product Registration Time:", average(productTimes));
    console.log("Average Shipment Time:", average(shipmentTimes));
    console.log("Average Distributor Verification Time:", average(distributorTimes));
    console.log("Average Pharmacist Verification Time:", average(pharmacistTimes));
  });
});
