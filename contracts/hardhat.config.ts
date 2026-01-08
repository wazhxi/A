import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: "0.8.24",
  paths: {
    sources: "contracts",
    tests: "test",
    scripts: "scripts",
    cache: ".cache",
    artifacts: "artifacts"
  },
  networks: {
    arbitrum: {
      url: process.env.ARBITRUM_RPC || "https://arb1.arbitrum.io/rpc"
    }
  }
};

export default config;
