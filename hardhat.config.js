require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.17",
  networks: {
    goerli: {
      url: `https://eth-goerli.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`,
      accounts: [process.env.PRIVATE_KEY,process.env.USER1_PRIVATE_KEY],
    },
    localhost: {
      url: `http://127.0.0.1:8545`,
      accounts: [process.env.PRIVATE_KEY,process.env.USER1_PRIVATE_KEY,],
    },
  },
};
