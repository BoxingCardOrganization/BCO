const { ethers } = require("hardhat");

async function main() {
  // grab CLI args
  const fighterId = process.argv[2];
  const cap = process.argv[3];
  const contractAddr = process.argv[4];

  if (!fighterId || !cap || !contractAddr) {
    console.error("Usage: node scripts/setCap.js <fighterId> <cap> <contractAddr>");
    process.exit(1);
  }

  // attach to deployed contract
  const FighterCard = await ethers.getContractFactory("FighterCard");
  const fc = FighterCard.attach(contractAddr);

  console.log(`Setting max supply for fighter ${fighterId} to ${cap}...`);

  const tx = await fc.setMaxSupply(fighterId, cap);
  await tx.wait();

  const result = await fc.maxSupplyByFighter(fighterId);
  console.log(`✅ Max supply for fighter ${fighterId} is now set to: ${result.toString()}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
