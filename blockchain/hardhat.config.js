require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const { INFURA_PROJECT_ID, PROVIDER_URL, PRIVATE_KEY, ETHERSCAN_API_KEY } = process.env;

module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.28",
        version: "0.8.28",
        settings: {
          optimizer: { enabled: true, runs: 200 },
          viaIR: false,
        },
      },
      {
        version: "0.8.20",
        version: "0.8.20",
        settings: {
          optimizer: { enabled: true, runs: 200 },
        },
      },
    ],
  },

  networks: {
    hardhat: {
      chainId: 1337,
      accounts: {
        count: 20,
        accountsBalance: "100000000000000000000"
      }
    },

    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 1337
    },

    // Sepolia network (Infura)
    sepolia: {
      url: PROVIDER_URL || (INFURA_PROJECT_ID ? `https://sepolia.infura.io/v3/${INFURA_PROJECT_ID}` : ""),
      // ensure PRIVATE_KEY is in your .env; add 0x prefix if missing
      accounts: PRIVATE_KEY
        ? [ PRIVATE_KEY.startsWith("0x") ? PRIVATE_KEY : `0x${PRIVATE_KEY}` ]
        : [],
      chainId: 11155111,
      gas: "auto",
      gasPrice: "auto"
    }
  },

  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },

  etherscan: {
    apiKey: ETHERSCAN_API_KEY || ""
  }
};