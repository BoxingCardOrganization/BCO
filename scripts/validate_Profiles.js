// scripts/validateProfiles.js
// Usage:
//   node scripts/validateProfiles.js \
//     --file scripts/data/fighter_profiles.json \
//     [--contract 0xYourFighterCard] [--rpc http://127.0.0.1:8545] [--fromBlock 0]
//
// Exit codes: 0 = all good, 1 = file/read error, 2 = validation fails, 3 = chain cross-check fails

const fs = require("fs");
const path = require("path");
const { ethers } = require("ethers");

// ---- CLI args ----
function arg(name, def) { const i = process.argv.indexOf(`--${name}`); return i > -1 ? process.argv[i+1] : def; }
const filePath   = path.resolve(arg("file", path.join(__dirname, "data", "fighter_profiles.json")));
const rpcUrl     = arg("rpc", process.env.RPC_URL || "http://127.0.0.1:8545");
const contract   = arg("contract", "");
const fromBlock  = Number(arg("fromBlock", 0));

// ---- Config / schema ----
const requiredTopLevel = {
  name: "string",
  fighterId: "number", // <- required for airtight cross-check
  tier: "string",
  winLoss: "object",
  ticketStats: "object",
  cardStats: "object",
  resaleStats: "object",
  news: "object", // arrays are typeof 'object'; we enforce Array.isArray below
};
const validTiers = ["PPV Star", "A-Level Draw", "Regional Headliner", "Fringe Contender"];

// ---- Helpers ----
function typeOf(v){ return Array.isArray(v) ? "array" : typeof v; }
function expectType(obj, key, expected, errors, ctx){
  if(!(key in obj)){ errors.push(`${ctx}: missing "${key}"`); return false; }
  const actual = typeOf(obj[key]);
  if(expected === "object"){ if(actual !== "object"){ errors.push(`${ctx}: "${key}" should be object, got ${actual}`); return false; } return true; }
  if(actual !== expected){ errors.push(`${ctx}: "${key}" should be ${expected}, got ${actual}`); return false; }
  return true;
}
function validateURL(url){ try{ new URL(url); return true; } catch { return false; } }

function validateWinLoss(wl, errors, ctx){
  for(const k of ["wins","losses","draws"]){
    if(!(k in wl) || typeof wl[k] !== "number" || wl[k] < 0){
      errors.push(`${ctx}: winLoss.${k} must be a non-negative number`);
    }
  }
}
function validateTicketStats(ts, errors, ctx){
  const maybes = [["lastGateUsd","number"],["lastPPVBuyrate","number"],["avgGateUsd","number"]];
  for(const [k,t] of maybes){ if(k in ts && typeof ts[k] !== t) errors.push(`${ctx}: ticketStats.${k} must be ${t}`); }
}
function validateCardStats(cs, errors, ctx){
  const maybes = [["totalMinted","number"],["floorUsdCents","number"],["avgResaleUsdCents","number"]];
  for(const [k,t] of maybes){ if(k in cs && (typeof cs[k] !== t || cs[k] < 0)) errors.push(`${ctx}: cardStats.${k} must be non-negative ${t}`); }
}
function validateResaleStats(rs, errors, ctx){
  const maybes = [["totalResales","number"],["lastResaleUsdCents","number"]];
  for(const [k,t] of maybes){ if(k in rs && (typeof rs[k] !== t || rs[k] < 0)) errors.push(`${ctx}: resaleStats.${k} must be non-negative ${t}`); }
}
function validateNews(news, errors, ctx){
  if(!Array.isArray(news)){ errors.push(`${ctx}: "news" should be an array`); return; }
  news.forEach((a,i)=>{
    const aCtx = `${ctx}.news[${i}]`;
    if(!a || typeof a !== "object"){ errors.push(`${aCtx}: item must be an object`); return; }
    for(const k of ["title","source","url"]){
      if(!a[k] || typeof a[k] !== "string") errors.push(`${aCtx}: missing/invalid "${k}"`);
    }
    if(a.url && !validateURL(a.url)) errors.push(`${aCtx}: invalid URL`);
  });
}

function validateFighter(f, i, seenNames, seenIds){
  const ctx = `Fighter[${i}]${f?.name ? ` "${f.name}"` : ""}`;
  const errors = [];

  // required fields
  for(const k in requiredTopLevel) expectType(f, k, requiredTopLevel[k], errors, ctx);

  // tier
  if(f.tier && !validTiers.includes(f.tier)) errors.push(`${ctx}: invalid tier "${f.tier}" — valid: ${validTiers.join(", ")}`);

  // unique name
  if(typeof f.name === "string"){
    const key = f.name.trim().toLowerCase();
    if(seenNames.has(key)) errors.push(`${ctx}: duplicate fighter name "${f.name}"`);
    seenNames.add(key);
  }

  // unique fighterId
  if(typeof f.fighterId === "number"){
    if(f.fighterId <= 0) errors.push(`${ctx}: fighterId must be positive integer`);
    if(seenIds.has(f.fighterId)) errors.push(`${ctx}: duplicate fighterId ${f.fighterId}`);
    seenIds.add(f.fighterId);
  }

  // nested
  if(f.winLoss && typeof f.winLoss === "object") validateWinLoss(f.winLoss, errors, ctx);
  if(f.ticketStats && typeof f.ticketStats === "object") validateTicketStats(f.ticketStats, errors, ctx);
  if(f.cardStats && typeof f.cardStats === "object") validateCardStats(f.cardStats, errors, ctx);
  if(f.resaleStats && typeof f.resaleStats === "object") validateResaleStats(f.resaleStats, errors, ctx);
  if(f.news) validateNews(f.news, errors, ctx);

  return errors;
}

// ---- Read & JSON validate ----
function validateJsonFile(){
  try{
    const raw = fs.readFileSync(filePath, "utf8");
    const data = JSON.parse(raw);
    if(!Array.isArray(data)){
      console.error("❌ Top-level JSON must be an array of fighters");
      process.exit(1);
    }
    const seenNames = new Set();
    const seenIds = new Set();
    let totalErrors = 0;

    data.forEach((f,i)=>{
      const errs = validateFighter(f,i,seenNames,seenIds);
      if(errs.length){
        totalErrors += errs.length;
        console.log(`\n❌ Fighter at index ${i} (${f?.name || "Unnamed"})`);
        errs.forEach(e => console.log("  - " + e));
      }
    });

    return { data, totalErrors, seenIds };
  } catch(e){
    console.error(`❌ Failed to read or parse ${filePath}: ${e.message}`);
    process.exit(1);
  }
}

// ---- On-chain cross-check (optional) ----
async function crossCheckOnChain(jsonIds){
  if(!contract){
    console.log("\nℹ️ No --contract provided, skipping on-chain cross-check.");
    return { ok: true };
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const iface = new ethers.Interface([
    "event Minted(address indexed to, uint256 indexed tokenId, uint256 indexed fighterId, uint256 offerUsdCents)"
  ]);

  // topic for Minted:
  const eventTopic = iface.getEvent("Minted").topicHash;

  // query logs
  const logs = await provider.getLogs({
    address: contract,
    topics: [eventTopic],
    fromBlock: isFinite(fromBlock) ? fromBlock : 0,
    toBlock: "latest",
  });

  const onchainIds = new Map(); // fighterId -> mintedCount
  for(const log of logs){
    const parsed = iface.parseLog(log);
    const fighterId = Number(parsed.args.fighterId);
    onchainIds.set(fighterId, (onchainIds.get(fighterId) || 0) + 1);
  }

  const jsonSet = new Set(jsonIds);
  const chainSet = new Set(onchainIds.keys());

  const missingInJson = [...chainSet].filter(id => !jsonSet.has(id));
  const missingOnChain = [...jsonSet].filter(id => !chainSet.has(id));

  let ok = true;
  if(missingInJson.length){
    ok = false;
    console.log("\n❌ Fighters minted on-chain but missing from JSON profiles:");
    missingInJson.forEach(id => console.log(`  - fighterId ${id} (minted ${onchainIds.get(id)} time(s))`));
  }
  if(missingOnChain.length){
    // not a hard error if you plan future mints, but we’ll warn strongly
    console.log("\n⚠️ Fighters present in JSON but not seen on-chain (yet):");
    missingOnChain.forEach(id => console.log(`  - fighterId ${id}`));
  }

  if(ok){
    console.log("\n✅ On-chain cross-check passed: JSON ↔ chain fighter IDs are aligned (or JSON has only future entries).");
  }else{
    console.log("\n❌ On-chain cross-check failed.");
  }
  return { ok, onchainIds };
}

// ---- Main ----
(async function run(){
  const { data, totalErrors, seenIds } = validateJsonFile();
  if(totalErrors > 0){
    console.log(`\n❌ Validation failed with ${totalErrors} issue(s).`);
    process.exit(2);
  }
  console.log("\n✅ JSON schema validation passed.");

  const { ok } = await crossCheckOnChain(seenIds);
  if(!ok) process.exit(3);

  console.log("\n✅ All checks passed.");
  process.exit(0);
})();
