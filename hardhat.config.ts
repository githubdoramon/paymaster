import { HardhatUserConfig } from "hardhat/config";

import "@matterlabs/hardhat-zksync-deploy";
import "@matterlabs/hardhat-zksync-solc";
import '@matterlabs/hardhat-zksync-verify';
import "@nomiclabs/hardhat-ethers";
import "@matterlabs/hardhat-zksync-chai-matchers";

// dynamically changes endpoints for local tests
const zkSyncTestnet =
  process.env.NODE_ENV == "test"
    ? {
      url: "http://localhost:3050",
      ethNetwork: "http://localhost:8545",
      zksync: true,
    }
    : {
      url: "https://zksync2-testnet.zksync.dev",
      ethNetwork: "goerli",
      zksync: true,
    };

const config: HardhatUserConfig = {
  zksolc: {
    version: "1.2.2",
    compilerSource: "binary",
    settings: {},
  },
  defaultNetwork: "zkSyncTestnet",
  networks: {
    hardhat: {
      zksync: false,
    },
    zkSyncTestnet,
  },
  solidity: {
    version: "0.8.17",
  },
};

export default config;
