const { ethers } = require("hardhat");

async function main() {
  const [deployer, backend] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  console.log("Backend Signer (auth):", backend.address);

  const FighterCard = await ethers.getContractFactory("FighterCard", deployer);
  const fc = await FighterCard.deploy(backend.address);
  await fc.waitForDeployment();

  console.log("FighterCard:", await fc.getAddress());
}

main().catch((e) => { console.error(e); process.exit(1); });
