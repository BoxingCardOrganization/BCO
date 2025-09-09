
import React, { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { formatCurrency, formatAddress } from '../lib/format'
import Loading from '../components/Loading'
import ErrorState from '../components/ErrorState'

function Wallet() {
  const [balance, setBalance] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showDepositSheet, setShowDepositSheet] = useState(false)
  const [showWithdrawSheet, setShowWithdrawSheet] = useState(false)
  const [depositAmount, setDepositAmount] = useState('')
  const [withdrawAmount, setWithdrawAmount] = useState('')

  const mockAccount = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
  
  const kycChecklist = [
    { id: 'identity', label: 'Identity Verification', completed: true },
    { id: 'address', label: 'Address Verification', completed: true },
    { id: 'bank', label: 'Bank Account', completed: false },
    { id: 'phone', label: 'Phone Verification', completed: true }
  ]

  useEffect(() => {
    loadBalance()
  }, [])

  const loadBalance = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await api.getBalance(mockAccount)
      setBalance(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDeposit = (e) => {
    e.preventDefault()
    // TODO: Process deposit
    alert(`Deposit of $${depositAmount} initiated!`)
    setShowDepositSheet(false)
    setDepositAmount('')
  }

  const handleWithdraw = (e) => {
    e.preventDefault()
    // TODO: Process withdrawal
    alert(`Withdrawal of $${withdrawAmount} initiated!`)
    setShowWithdrawSheet(false)
    setWithdrawAmount('')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Wallet</h1>
          <p className="text-gray-600">
            Manage your funds and account verification status.
          </p>
        </div>

        {loading && <Loading />}
        {error && <ErrorState title="Failed to load wallet" description={error} onRetry={loadBalance} />}

        {!loading && !error && (
          <>
            {/* Balance Card */}
            <div className="bg-gradient-to-r from-bco-primary to-bco-accent text-white rounded-lg p-6 mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg opacity-90 mb-2">Available Balance</p>
                  <p className="text-4xl font-bold">
                    {balance ? formatCurrency(parseFloat(balance.balance) * 100) : '$0.00'}
                  </p>
                  <p className="text-sm opacity-75 mt-2">
                    Account: {formatAddress(mockAccount)}
                  </p>
                </div>
                <div className="text-right">
                  <svg className="w-12 h-12 opacity-75" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <button 
                onClick={() => setShowDepositSheet(true)}
                className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow text-left"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Deposit Funds</h3>
                    <p className="text-sm text-gray-600">Add money to your wallet</p>
                  </div>
                </div>
              </button>

              <button 
                onClick={() => setShowWithdrawSheet(true)}
                className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow text-left"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Withdraw Funds</h3>
                    <p className="text-sm text-gray-600">Transfer to your bank</p>
                  </div>
                </div>
              </button>
            </div>

            {/* KYC Checklist */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Account Verification</h2>
              <div className="space-y-4">
                {kycChecklist.map((item) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        item.completed ? 'bg-green-100' : 'bg-gray-100'
                      }`}>
                        {item.completed ? (
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <div className="w-2 h-2 bg-gray-400 rounded-full" />
                        )}
                      </div>
                      <span className={`font-medium ${item.completed ? 'text-gray-900' : 'text-gray-600'}`}>
                        {item.label}
                      </span>
                    </div>
                    {!item.completed && (
                      <button className="text-bco-primary hover:text-bco-primary/80 text-sm font-medium">
                        Complete
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  Complete all verification steps to unlock higher deposit limits and faster withdrawals.
                </p>
              </div>
            </div>

            {/* Recent Transactions (Mock) */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Transactions</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Deposit</p>
                      <p className="text-sm text-gray-600">Jan 15, 2024</p>
                    </div>
                  </div>
                  <span className="font-medium text-green-600">+$500.00</span>
                </div>
                
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-bco-primary/10 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-bco-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Fighter Card Purchase</p>
                      <p className="text-sm text-gray-600">Lightning Lopez • Jan 14, 2024</p>
                    </div>
                  </div>
                  <span className="font-medium text-gray-900">-$45.00</span>
                </div>
                
                <div className="text-center py-4">
                  <button className="text-bco-primary hover:text-bco-primary/80 text-sm font-medium">
                    View All Transactions
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Deposit Sheet */}
      {showDepositSheet && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center">
          <div className="bg-white rounded-t-lg sm:rounded-lg w-full sm:max-w-md mx-4 mb-0 sm:mb-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Deposit Funds</h3>
                <button 
                  onClick={() => setShowDepositSheet(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleDeposit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount
                  </label>
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="0.00"
                    className="input-base"
                    min="1"
                    step="0.01"
                    required
                  />
                </div>
                
                <div className="mb-6">
                  <p className="text-sm text-gray-600">
                    Funds will be available immediately after processing.
                  </p>
                </div>
                
                <button type="submit" className="w-full btn-primary">
                  Deposit ${depositAmount || '0.00'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Withdraw Sheet */}
      {showWithdrawSheet && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center">
          <div className="bg-white rounded-t-lg sm:rounded-lg w-full sm:max-w-md mx-4 mb-0 sm:mb-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Withdraw Funds</h3>
                <button 
                  onClick={() => setShowWithdrawSheet(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleWithdraw}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount
                  </label>
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="0.00"
                    className="input-base"
                    min="1"
                    step="0.01"
                    max={balance ? parseFloat(balance.balance) : 0}
                    required
                  />
                </div>
                
                <div className="mb-6">
                  <p className="text-sm text-gray-600">
                    Withdrawals typically take 1-3 business days to process.
                  </p>
                </div>
                
                <button type="submit" className="w-full btn-primary">
                  Withdraw ${withdrawAmount || '0.00'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Wallet
