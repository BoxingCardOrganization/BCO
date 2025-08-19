// node scripts/signMintAuth.js --to <addr> --offer 40 --fighter 555 --contract <addr> --pk <backend_pk> > sig.json
const { ethers } = require("ethers");
function arg(name, def){ const i=process.argv.indexOf(`--${name}`); return i>-1?process.argv[i+1]:def; }

async function main(){
  const to = arg("to"); const offer = Number(arg("offer"));
  const fighterId = Number(arg("fighter")); const contract = arg("contract");
  const pk = arg("pk", process.env.BACKEND_SIGNER_PK); const deadlineSec = Number(arg("deadlineSec", 900));
  if(!to||!offer||!fighterId||!contract) throw new Error("Missing --to --offer --fighter --contract");
  if(!pk) throw new Error("Provide --pk or BACKEND_SIGNER_PK");

  const rpc = process.env.RPC_URL || "http://127.0.0.1:8545";
  const provider = new ethers.JsonRpcProvider(rpc);
  const wallet = new ethers.Wallet(pk, provider);
  const chainId = Number((await provider.getNetwork()).chainId);

  const domain = { name:"BCO-FighterCard", version:"1", chainId, verifyingContract: contract };
  const types = { MintAuth:[
    {name:"to",type:"address"}, {name:"offerUsdCents",type:"uint256"},
    {name:"fighterId",type:"uint256"}, {name:"deadline",type:"uint256"}, {name:"nonce",type:"bytes32"},
  ]};
  const mint = {
    to, offerUsdCents: Math.round(offer*100), fighterId,
    deadline: Math.floor(Date.now()/1000)+deadlineSec, nonce: ethers.hexlify(ethers.randomBytes(32)),
  };
  const sig = await wallet.signTypedData(domain, types, mint);
  console.log(JSON.stringify({ domain, types, mint, sig }, null, 2));
}
main().catch(e=>{console.error(e);process.exit(1);});
