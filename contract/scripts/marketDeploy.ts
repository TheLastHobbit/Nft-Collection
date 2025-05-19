const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  const cUSDTAddress = "0x19872bECF513D7064ddDd33638E1CC097373af1c";
  const myNFTAddress = "0x2C3a706039846849107c17cDFD22F6BbC753d764";

  const Market = await hre.ethers.getContractFactory("Market");
  const market = await Market.deploy(cUSDTAddress, myNFTAddress);

  await market.waitForDeployment();
  const marketAddress = await market.getAddress();
  console.log("Market deployed to:", marketAddress);

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });