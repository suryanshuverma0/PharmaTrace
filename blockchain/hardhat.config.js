require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.28",  // Add this version to match your contracts
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
          viaIR: false,  // Disable viaIR to avoid stack too deep errors
        },
      },
      {
        version: "0.8.20",  // or your other versions if needed
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
  networks: {
    hardhat: {
      chainId: 1337,
      accounts: {
        count: 20,
        accountsBalance: "100000000000000000000" // 100 ETH per account
      }
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 1337
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};
