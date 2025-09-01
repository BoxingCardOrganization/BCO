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
// scripts/setCap.js
// Usage: node scripts/setCap.js --fighter 123 --attendance 10000 --contract 0x... [--rpc http://127.0.0.1:8545]
const { ethers } = require("ethers");

function arg(name, def) { 
  const i = process.argv.indexOf(`--${name}`); 
  return i > -1 ? process.argv[i + 1] : def; 
}

async function main() {
  const fighterId = Number(arg("fighter"));
  const attendance = Number(arg("attendance"));
  const contract = arg("contract");
  const rpc = arg("rpc", process.env.RPC_URL || "http://127.0.0.1:8545");
  const pk = process.env.ADMIN_PRIVATE_KEY || process.env.PRIVATE_KEY;

  if (!fighterId || !attendance || !contract) {
    throw new Error("Missing --fighter --attendance --contract");
  }
  if (!pk) {
    throw new Error("Set ADMIN_PRIVATE_KEY or PRIVATE_KEY in environment");
  }

  const provider = new ethers.JsonRpcProvider(rpc);
  const admin = new ethers.Wallet(pk, provider);

  const abi = [
    "function recordAttendance(uint256,uint256)",
    "function increaseMaxSupply(uint256,uint256)",
    "function getAttendanceRecord(uint256) view returns (uint256)",
    "function maxSupplyByFighter(uint256) view returns (uint256)",
    "function mintedByFighter(uint256) view returns (uint256)",
    "event AttendanceRecorded(uint256 indexed fighterId, uint256 attendance)",
    "event MaxSupplySet(uint256 indexed fighterId, uint256 maxSupply)"
  ];

  const fc = new ethers.Contract(contract, abi, admin);

  try {
    // Get current state
    const [currentAttendance, currentCap, minted] = await Promise.all([
      fc.getAttendanceRecord(fighterId),
      fc.maxSupplyByFighter(fighterId),
      fc.mintedByFighter(fighterId)
    ]);

    console.log(`Fighter ${fighterId} current state:`);
    console.log(`  Current attendance: ${currentAttendance}`);
    console.log(`  Current cap: ${currentCap}`);
    console.log(`  Minted: ${minted}`);
    console.log(`  New attendance: ${attendance}`);
    console.log(`  Calculated cap: ${Math.floor(attendance / 2)}`);

    // Record attendance
    const tx = await fc.recordAttendance(fighterId, attendance);
    const receipt = await tx.wait();
    
    console.log(`\nTransaction hash: ${receipt.hash}`);
    
    // Parse events
    const iface = new ethers.Interface(abi);
    for (const log of receipt.logs) {
      try {
        const parsed = iface.parseLog(log);
        if (parsed.name === "AttendanceRecorded") {
          console.log(`✅ Attendance recorded: ${parsed.args.attendance}`);
        } else if (parsed.name === "MaxSupplySet") {
          console.log(`✅ Cap updated: ${parsed.args.maxSupply}`);
        }
      } catch (e) {
        // Ignore unparseable logs
      }
    }

    // Get final state
    const [finalAttendance, finalCap] = await Promise.all([
      fc.getAttendanceRecord(fighterId),
      fc.maxSupplyByFighter(fighterId)
    ]);

    console.log(`\nFinal state:`);
    console.log(`  Attendance: ${finalAttendance}`);
    console.log(`  Cap: ${finalCap}`);

  } catch (error) {
    if (error.shortMessage) {
      console.error("❌ Error:", error.shortMessage);
    } else {
      console.error("❌ Error:", error.message);
    }
    process.exit(1);
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
