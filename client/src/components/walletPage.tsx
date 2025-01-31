import React, { useState } from 'react';
import { Wallet, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

interface WalletPageProps {
  isWalletConnected: boolean;
}

function WalletPage({ isWalletConnected }: WalletPageProps) {
  const [amount, setAmount] = useState('');
  const [isDeposit, setIsDeposit] = useState(true);

  // Static wallet data for demonstration
  const walletBalance = "1.5";
  const walletAddress = "0x1234...5678";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle deposit/withdraw transaction here
    console.log(`${isDeposit ? 'Deposit' : 'Withdraw'} transaction:`, { amount });
  };

  if (!isWalletConnected) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Wallet className="h-16 w-16 text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect Your Wallet</h2>
        <p className="text-gray-600">Please connect your wallet to access this feature</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Wallet Info */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Wallet Overview</h2>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <span className="text-sm font-medium text-gray-500">Balance</span>
            <div className="text-3xl font-bold text-gray-900">{walletBalance} ETH</div>
          </div>
          <div className="space-y-2">
            <span className="text-sm font-medium text-gray-500">Wallet Address</span>
            <div className="text-sm font-mono bg-gray-50 p-2 rounded">{walletAddress}</div>
          </div>
        </div>
      </div>

      {/* Transaction Form */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setIsDeposit(true)}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-lg ${
              isDeposit
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <ArrowDownCircle className="h-5 w-5" />
            <span>Deposit</span>
          </button>
          <button
            onClick={() => setIsDeposit(false)}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-lg ${
              !isDeposit
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <ArrowUpCircle className="h-5 w-5" />
            <span>Withdraw</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Amount (ETH)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Enter amount in ETH"
              required
              step="0.0001"
              min="0"
            />
          </div>

          <button
            type="submit"
            className={`w-full flex justify-center items-center space-x-2 py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
              isDeposit ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isDeposit ? <ArrowDownCircle className="h-5 w-5" /> : <ArrowUpCircle className="h-5 w-5" />}
            <span>{isDeposit ? 'Deposit' : 'Withdraw'} ETH</span>
          </button>
        </form>
      </div>
    </div>
  );
}

export default WalletPage;