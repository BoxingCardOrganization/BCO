// node scripts/mintWithSig.js --userPk <0x..> --sigJson sig.json --contract <addr> [--rpc http://127.0.0.1:8545]
const fs = require("fs");
const { ethers } = require("ethers");

function arg(name, def){ const i=process.argv.indexOf(`--${name}`); return i>-1?process.argv[i+1]:def; }

async function main(){
  const userPk   = arg("userPk");
  const sigPath  = arg("sigJson");
  const contract = arg("contract");
  const rpc      = arg("rpc", process.env.RPC_URL || "http://127.0.0.1:8545");

  if(!userPk || !sigPath || !contract) {
    throw new Error("Missing --userPk --sigJson --contract");
  }

  // Read sig payload; support both shapes
  const raw = JSON.parse(fs.readFileSync(sigPath, "utf8"));
  const mint = raw.mint ? raw.mint : {
    to: raw.to,
    offerUsdCents: raw.offerUsdCents,
    fighterId: raw.fighterId,
    deadline: raw.deadline,
    nonce: raw.nonce
  };
  const sig  = raw.sig || raw.signature;

  if(!mint || !mint.to || !mint.offerUsdCents || !mint.fighterId || !mint.deadline || !mint.nonce || !sig) {
    throw new Error("sig.json missing required fields (expect { mint:{to,offerUsdCents,fighterId,deadline,nonce}, sig })");
  }

  const provider = new ethers.JsonRpcProvider(rpc);
  const user = new ethers.Wallet(userPk, provider);

  const abi = [
    "event Minted(address indexed to, uint256 indexed tokenId, uint256 indexed fighterId, uint256 offerUsdCents)",
    "function mintWithSig((address,uint256,uint256,uint256,bytes32),bytes) returns (uint256)",
    "function ownerOf(uint256) view returns (address)",
    "function getMintPrice(uint256) view returns (uint256)",
    "function getCardValue(uint256) view returns (uint256)",
    "function fighterIdOf(uint256) view returns (uint256)",
    // optional (caps)
    "function mintedByFighter(uint256) view returns (uint256)",
    "function maxSupplyByFighter(uint256) view returns (uint256)"
  ];
  const contractInst = new ethers.Contract(contract, abi, user);
  const iface = new ethers.Interface(abi);

  // IMPORTANT: pass tuple as ARRAY (order: to, offerUsdCents, fighterId, deadline, nonce)
  const tupleArgs = [mint.to, mint.offerUsdCents, mint.fighterId, mint.deadline, mint.nonce];

  try {
    const tx = await contractInst.mintWithSig(tupleArgs, sig);
    const rcpt = await tx.wait();
    console.log("Mint tx hash:", rcpt.hash);

    // Parse the real tokenId from the Minted event
    let tokenId = null;
    for (const log of rcpt.logs) {
      if (log.address.toLowerCase() !== contract.toLowerCase()) continue;
      try {
        const parsed = iface.parseLog(log);
        if (parsed && parsed.name === "Minted") {
          tokenId = Number(parsed.args.tokenId);
          break;
        }
      } catch {}
    }
    if (tokenId == null) {
      console.warn("⚠️ Couldn't parse Minted event; falling back to tokenId=1");
      tokenId = 1;
    }

    // Read back details
    const [owner, priceC, valueC, fid] = await Promise.all([
      contractInst.ownerOf(tokenId),
      contractInst.getMintPrice(tokenId),
      contractInst.getCardValue(tokenId),
      contractInst.fighterIdOf(tokenId),
    ]);

    let mintedCount, maxSupply;
    try {
      mintedCount = await contractInst.mintedByFighter(fid);
      maxSupply   = await contractInst.maxSupplyByFighter(fid);
    } catch { /* caps not present -> ignore */ }

    const toUsd = (c) => `$${(Number(c)/100).toFixed(2)}`;
    const out = {
      tokenId,
      fighterId: Number(fid),
      owner,
      mintPriceUsdCents: Number(priceC),
      mintPriceUsd: toUsd(priceC),
      currentValueUsdCents: Number(valueC),
      currentValueUsd: toUsd(valueC),
    };
    if (mintedCount !== undefined) out.mintedByFighter = Number(mintedCount);
    if (maxSupply   !== undefined) out.maxSupplyByFighter = Number(maxSupply);

    console.log(JSON.stringify(out, null, 2));
  } catch (e) {
    if (e && e.shortMessage) console.error("❌ Revert:", e.shortMessage);
    else if (e && e.reason)   console.error("❌ Revert:", e.reason);
    else                      console.error("❌ Error:", e.message || e);
    process.exit(1);
  }
}

main().catch(e=>{ console.error(e); process.exit(1); });

