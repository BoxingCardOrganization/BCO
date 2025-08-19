require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const {
  PRIVATE_KEY,
  ALCHEMY_API_KEY,
  ETHERSCAN_API_KEY,
} = process.env;

const ALCHEMY_SEPOLIA_URL = ALCHEMY_API_KEY
  ? `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`
  : "";

module.exports = {
  solidity: {
    version: "0.8.28",
    settings: { optimizer: { enabled: true, runs: 200 } },
  },
  mocha: { timeout: 60000 },
  networks: {
    hardhat: {},
    sepolia: {
      url: ALCHEMY_SEPOLIA_URL,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY || "",
  },
};
