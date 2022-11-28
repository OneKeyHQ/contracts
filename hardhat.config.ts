import { HardhatUserConfig, task } from "hardhat/config";
import { createAlchemyWeb3 } from "@alch/alchemy-web3";
import "@nomicfoundation/hardhat-toolbox";
import "@nomiclabs/hardhat-ethers";
import dotenv from "dotenv";

dotenv.config();

const API_URL_ETH = `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_EVM_MAINNET}`;
const API_URL_GOERLI = `https://eth-goerli.g.alchemy.com/v2/${process.env.ALCHEMY_EVM_GOERLI}`;
const API_URL_POLYGON = `https://polygon-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_EVM_POLYGON}`;
const API_URL_ARBITRUM = `https://arb-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_EVM_ARBITRUM}`;
const API_URL_OPTIMISM = `https://opt-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_EVM_OPTIMISM}`;
const API_URL_BSC = "https://bsc-dataseed.binance.org/";
const API_URL_AVALANCHE = "https://api.avax.network/ext/bc/C/rpc";

const config: HardhatUserConfig = {
  solidity: "0.8.17",
  networks: {
    eth: {
      url: API_URL_ETH,
      accounts: {
        mnemonic: process.env.EVM_ACCOUNT_MNEMONIC,
      },
    },
    goerli: {
      url: API_URL_GOERLI,
      accounts: {
        mnemonic: process.env.EVM_ACCOUNT_MNEMONIC,
      },
    },
    polygon: {
      url: API_URL_POLYGON,
      accounts: {
        mnemonic: process.env.EVM_ACCOUNT_MNEMONIC,
      },
    },
    arbitrum: {
      url: API_URL_ARBITRUM,
      accounts: {
        mnemonic: process.env.EVM_ACCOUNT_MNEMONIC,
      },
    },
    optimism: {
      url: API_URL_OPTIMISM,
      accounts: {
        mnemonic: process.env.EVM_ACCOUNT_MNEMONIC,
      },
    },
    bsc: {
      url: API_URL_BSC,
      chainId: 56,
      gasPrice: 20000000000,
      accounts: {
        mnemonic: process.env.EVM_ACCOUNT_MNEMONIC,
      },
    },
    avalanche: {
      url: API_URL_AVALANCHE,
      gasPrice: 225000000000,
      chainId: 43114,
      accounts: {
        mnemonic: process.env.EVM_ACCOUNT_MNEMONIC,
      },
    },
  },
};

task(
  "account",
  "returns nonce and balance for specified address on multiple networks"
)
  .addParam("address")
  .setAction(async (address) => {
    const web3Goerli = createAlchemyWeb3(API_URL_GOERLI);
    const web3Polygon = createAlchemyWeb3(API_URL_POLYGON);

    const networkIDArr = ["Ethereum Goerli:", "Polygon  Mainnet:"];
    const providerArr = [web3Goerli, web3Polygon];
    const resultArr = [];

    for (let i = 0; i < providerArr.length; i++) {
      const nonce = await providerArr[i].eth.getTransactionCount(
        address.address,
        "latest"
      );
      const balance = await providerArr[i].eth.getBalance(address.address);
      resultArr.push([
        networkIDArr[i],
        nonce,
        parseFloat(providerArr[i].utils.fromWei(balance, "ether")).toFixed(2) +
          "ETH",
      ]);
    }
    resultArr.unshift(["  |NETWORK|   |NONCE|   |BALANCE|  "]);
    console.log(resultArr);
  });

export default config;
