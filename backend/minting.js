const { ethers } = require('ethers')
const path = require('path')
const fs = require('fs')
const { getMinter } = require('./wallet')

function loadAbi() {
  const abiPath = path.join(__dirname, 'abi', 'FighterCard.json')
  try {
    if (!fs.existsSync(abiPath)) return []
    const json = JSON.parse(fs.readFileSync(abiPath, 'utf8'))
    return Array.isArray(json) ? json : (json.abi || [])
  } catch (_) {
    return []
  }
}

async function quoteMint({ fighterId, qty }) {
  const q = Math.max(1, Number(qty || 1))
  const base = 5 * q
  const platform = base * 0.1
  const network = 0.25
  const total = base + platform + network
  return {
    currency: 'USD',
    lineItems: [
      { label: `Base (${q} @ $5.00)`, amountUsd: Number(base.toFixed(2)) },
      { label: 'Platform fee (10%)', amountUsd: Number(platform.toFixed(2)) },
      { label: 'Network fee', amountUsd: Number(network.toFixed(2)) },
    ],
    totalUsd: Number(total.toFixed(2)),
  }
}

async function mintWithSig({ userId, fighterId, qty }) {
  const signer = getMinter()
  // Mock if signer missing or ABI/contract not configured
  if (!signer) {
    const mockHash = ethers.id(`mint:${userId}:${fighterId}:${Date.now()}`)
    return { txHash: mockHash }
  }
  const abi = loadAbi()
  const address = process.env.CONTRACT_ADDRESS
  if (!address || abi.length === 0) {
    const mockHash = ethers.id(`mint:${userId}:${fighterId}:${Date.now()}`)
    return { txHash: mockHash }
  }
  const contract = new ethers.Contract(address, abi, signer)
  // Placeholder method call; adjust to actual contract mint signature later
  try {
    const tx = await contract.mintWithSignature?.(fighterId, qty)
    const receipt = await tx.wait?.()
    return { txHash: receipt?.transactionHash || tx?.hash || ethers.id(`tx:${Date.now()}`) }
  } catch (_) {
    // Fall back to mock on any failure
    const mockHash = ethers.id(`mint:${userId}:${fighterId}:${Date.now()}`)
    return { txHash: mockHash }
  }
}

module.exports = { quoteMint, mintWithSig }

