import { ethers, run } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // 部署 cUSDT 合约
  console.log("Deploying cUSDT contract...");
  const CUSDT = await ethers.getContractFactory("cUSDT");
  const cusdt = await CUSDT.deploy();
  await cusdt.waitForDeployment();
  const cusdtAddress = await cusdt.getAddress();
  console.log("cUSDT deployed to:", cusdtAddress);

  // 部署 MyNFT 合约
  console.log("\nDeploying MyNFT contract...");
  const MyNFT = await ethers.getContractFactory("MyNFT");
  const myNFT = await MyNFT.deploy();
  await myNFT.waitForDeployment();
  const myNFTAddress = await myNFT.getAddress();
  console.log("MyNFT deployed to:", myNFTAddress);

  // 部署 Market 合约
  console.log("\nDeploying Market contract...");
  const Market = await ethers.getContractFactory("Market");
  const market = await Market.deploy(cusdtAddress, myNFTAddress);
  await market.waitForDeployment();
  const marketAddress = await market.getAddress();
  console.log("Market deployed to:", marketAddress);

  // 打印所有合约地址的总结
  console.log("\n=== Deployment Summary ===");
  console.log("cUSDT:", cusdtAddress);
  console.log("MyNFT:", myNFTAddress);
  console.log("Market:", marketAddress);

  // 等待区块确认
  console.log("\nWaiting for block confirmations...");
  await cusdt.deploymentTransaction()?.wait(5);
  await myNFT.deploymentTransaction()?.wait(5);
  await market.deploymentTransaction()?.wait(5);

  // 验证合约
  console.log("\nVerifying contracts on Etherscan...");
  try {
    await run("verify:verify", {
      address: cusdtAddress,
      constructorArguments: [],
    });

    await run("verify:verify", {
      address: myNFTAddress,
      constructorArguments: [],
    });

    await run("verify:verify", {
      address: marketAddress,
      constructorArguments: [cusdtAddress, myNFTAddress],
    });
  } catch (error) {
    console.log("Error verifying contracts:", error);
  }
}

// 运行部署脚本
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });