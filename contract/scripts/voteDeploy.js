const { ethers } = require("hardhat");

async function main() {
  // 获取部署者账户
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // 检查账户余额
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  // 获取合约工厂
  const NFTMarketVoting = await ethers.getContractFactory("NFTMarketVoting");

  // 部署合约
  console.log("Deploying NFTMarketVoting...");
  const voting = await NFTMarketVoting.deploy();

  // 等待部署完成
  await voting.deploymentTransaction().wait(1); // 等待1个区块确认
  console.log("NFTMarketVoting deployed to:", voting.target);

  // 验证合约（适用于公共网络，如 Sepolia）
  if (network.name === "sepolia") {
    console.log("Waiting for block confirmations...");
    await voting.deploymentTransaction().wait(6); // 等待6个区块确认
    console.log("Verifying contract...");
    try {
      await hre.run("verify:verify", {
        address: voting.target,
        constructorArguments: [],
      });
      console.log("Contract verified successfully");
    } catch (error) {
      console.error("Verification failed:", error.message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });