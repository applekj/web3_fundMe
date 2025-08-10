import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import 'hardhat-deploy'
import 'hardhat-deploy-ethers'
import './tasks/index'
import * as envEnc from '@chainlink/env-enc';

envEnc.config()

//设置代理
import { ProxyAgent, setGlobalDispatcher } from "undici";
const proxyAgent = new ProxyAgent("http://127.0.0.1:33210");
setGlobalDispatcher(proxyAgent);


const SEPOLIA_URL = process.env.SEPOLIA_URL || ''
const PRIVATE_KEY_1 = process.env.PRIVATE_KEY_1 || ''
const ETHERSCAN_APIKEY_SEPOLIA = process.env.ETHERSCAN_APIKEY_SEPOLIA || ''

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  mocha: { timeout: 300000 },
  networks: {
    sepolia: {
      url: SEPOLIA_URL,
      accounts: [PRIVATE_KEY_1],
      chainId: 11155111
    }
  },
  etherscan: {
    apiKey: {
      sepolia: ETHERSCAN_APIKEY_SEPOLIA
    }
  },
  namedAccounts: {
    firstAccount: {
      default: 0
    },
    secondAccount: {
      default: 1
    }
  },
  gasReporter: {
    enabled: false
  }
};

export default config;
