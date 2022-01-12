require("dotenv").config();

require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");
require("hardhat-gas-reporter");
require("solidity-coverage");

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: "0.8.4",
  ropsten: {
    url: `https://ropsten.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
    accounts: [`0x${process.env.PRIVATE_KEY}`]
  },
  kovan: {
    url: `https://kovan.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
    accounts: [`0x${process.env.PRIVATE_KEY}`]
  },
  rinkeby: {
    url: `https://rinkeby.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
    accounts: [`0x${process.env.PRIVATE_KEY}`]
  },
  goerli: {
    url: `https://goerli.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
    accounts: [`0x${process.env.PRIVATE_KEY}`]
  },
  mainnet: {
    url: `https://mainnet.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
    accounts: [`0x${process.env.PRIVATE_KEY}`]
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};
