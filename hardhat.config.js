//require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-truffle5");
require('@nomiclabs/hardhat-ethers');
require('@nomiclabs/hardhat-web3');
require('@openzeppelin/hardhat-upgrades');

const { key, mnemonic, key_infura, key_infura_mainnet} = require('./secrets.json');

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accountss", "Prints the list of accounts", async () => {
  //const accounts = await ethers.getSigners();
  const accounts = await web3.eth.getAccounts();

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
  solidity: {
      compilers: [
          {
            version: "0.8.1",
            settings: {
                optimizer: {
                    enabled: true,
                    runs: 200,
                }
            }
          },
          {
            version: "0.8.1",
            settings: {}
          }
      ]
  },
  defaultNetwork: "internal",
  networks: {
      hardhat: {
          mining: {
              auto: true,
              //interval: [1000, 3000]
          }
      },
      localhost: {
      },

      internal_alchemy: {
          url: `https://eth-kovan.alchemyapi.io/v2/${key}`,
          accounts :{mnemonic : mnemonic}
      },

      external: {
          url: `http://124.251.110.238/rpc`,
          accounts :{mnemonic : mnemonic}
      },
      internal: {
          //url: `https://kovan.infura.io/v3/${key_infura}`,
          url: `http://124.251.110.238/rpc`,
          accounts :{mnemonic : mnemonic}
      },
      mainnet: {
          url: `http://124.251.110.238/rpc`,
          accounts :{mnemonic : mnemonic}
      }
  },
  paths: {
      root: "./",
      sources: "./contracts",
      tests: "./tests",
      cache: "./cache",
      artifacts: "./artifacts",
  }
};

