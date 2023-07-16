require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: "0.8.9",
  // networks: {
  //   hardhat: {
  //     forking: {
  //       url: process.env.ALCHEMY_MAINNET_RPC_URL, // Replace with your preferred Ethereum node URL
  //       blockNumber: 13300000, // Replace with the block number you want to fork from
  //     },
  //   },
  // },
};
