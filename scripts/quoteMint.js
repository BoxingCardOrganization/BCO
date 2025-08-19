// node scripts/quoteMint.js --offer 40 --fighter 555 --to <addr> --contract <addr>
const { ethers } = require("ethers");

function arg(name, def){ const i=process.argv.indexOf(`--${name}`); return i>-1?process.argv[i+1]:def; }

async function main(){
  const to = arg("to"); const offer = Number(arg("offer"));
  const fighterId = Number(arg("fighter")); const contract = arg("contract");
  if(!to||!offer||!fighterId||!contract) throw new Error("Missing --to --offer --fighter --contract");

  const rpc = process.env.RPC_URL || "http://127.0.0.1:8545";
  const provider = new ethers.JsonRpcProvider(rpc);

  const iface = new ethers.Interface([
    "function mintWithSig((address,uint256,uint256,uint256,bytes32),bytes) returns (uint256)"
  ]);

  const mint = {
    to,
    offerUsdCents: Math.round(offer*100),
    fighterId,
    deadline: Math.floor(Date.now()/1000)+600,
    nonce: "0x"+"00".repeat(32),
  };
  const dummySig = "0x"+"11".repeat(65);

  // tuple as array for ethers v6
  const tupleArgs = [mint.to, mint.offerUsdCents, mint.fighterId, mint.deadline, mint.nonce];
  const data = iface.encodeFunctionData("mintWithSig", [tupleArgs, dummySig]);

  // Try live estimate; if it reverts (bad sig), fall back to a constant
  let gasUnits;
  try {
    gasUnits = await provider.estimateGas({ to: contract, data });
  } catch {
    const DEFAULT_GAS = Number(process.env.MINT_GAS_UNITS || 180000); // based on your tests (~177k)
    gasUnits = BigInt(DEFAULT_GAS);
  }

  const feeData = await provider.getFeeData();
  const gasPrice = feeData.maxFeePerGas ?? feeData.gasPrice ?? 0n;
  const eth = Number(gasUnits * gasPrice) / 1e18;

  const ETH_USD = Number(process.env.ETH_USD || 3000);
  const gasUsd = Math.ceil(eth*ETH_USD*120)/100; // +20% buffer
  const offerUsd = offer;
  const serviceBps = Number(process.env.SERVICE_FEE_BPS || 500); // 5%
  const feeUsd = Math.ceil(((offerUsd+gasUsd)*serviceBps)/100)/100;
  const totalUsd = +(offerUsd+gasUsd+feeUsd).toFixed(2);

  console.log(JSON.stringify({
    breakdown:{ offerUsd:+offerUsd.toFixed(2), gasUsd:+gasUsd.toFixed(2), serviceFeeUsd:+feeUsd.toFixed(2), totalUsd },
    gasUnits: gasUnits.toString(), gasPrice: gasPrice?.toString(), ethCost: eth
  }, null, 2));
}
main().catch(e=>{console.error(e);process.exit(1);});

