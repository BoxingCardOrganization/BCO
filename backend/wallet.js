const { v4: uuidv4 } = require('uuid')
const { ethers } = require('ethers')

let _provider = null
function getProvider() {
  if (_provider) return _provider
  const url = process.env.RPC_URL || 'http://127.0.0.1:8545'
  try {
    _provider = new ethers.JsonRpcProvider(url)
  } catch (_) {
    _provider = null
  }
  return _provider
}

let _minter = null
function getMinter() {
  if (_minter) return _minter
  const key = process.env.MINT_SIGNER_KEY
  const provider = getProvider()
  if (!key || !provider) {
    // In dev/mock, allow missing signer
    return null
  }
  _minter = new ethers.Wallet(key, provider)
  return _minter
}

function ensureUserWallet(user) {
  if (!user.wallet) user.wallet = {}
  if (!user.wallet.depositAddress) {
    // Pseudo address for now; not an actual chain address
    user.wallet.depositAddress = `cust_${uuidv4()}`
  }
  return user.wallet
}

module.exports = { getProvider, getMinter, ensureUserWallet }

