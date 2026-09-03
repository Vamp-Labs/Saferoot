import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const sepoliaRpcUrl = process.env.SEPOLIA_RPC_URL ?? "";
const creditcoinCc3RpcUrl =
  process.env.CREDITCOIN_CC3_RPC_URL ?? "https://rpc.cc3-testnet.creditcoin.network";
const deployerPrivateKey = process.env.DEPLOYER_PRIVATE_KEY ?? "";
const accounts = deployerPrivateKey ? [deployerPrivateKey] : [];

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      viaIR: true
    }
  },
  networks: {
    hardhat: {
      chainId: 31337
    },
    ethereumSepolia: {
      url: sepoliaRpcUrl,
      chainId: 11155111,
      accounts
    },
    creditcoinCc3: {
      url: creditcoinCc3RpcUrl,
      chainId: 102031,
      accounts
    }
  },
  etherscan: {
    apiKey: {
      sepolia: process.env.ETHERSCAN_API_KEY ?? ""
    }
  },
  typechain: {
    outDir: "typechain-types",
    target: "ethers-v6"
  }
};

export default config;
