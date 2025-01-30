"use client";

import { useState, useEffect } from "react";
import Web3 from "web3";
import { Wallet, Battery, BatteryCharging, ArrowRightLeft } from "lucide-react";
import { Alert, AlertDescription } from "../../components/alert";
import vmContract from "../../../blockchain/firstcontract";
import closebid from "../../../blockchain/closebid";

export default function VendingMachine() {
  // ... [previous state declarations remain the same]
  const [error, setError] = useState("");
  const [errorProgress, setErrorProgress] = useState(100);
  const [inventory, setInventory] = useState("");
  const [role, setRole] = useState(null);
  const [web3, setWeb3] = useState(null);
  const [account, setAccount] = useState(null);
  const [buyAmount, setBuyAmount] = useState("");
  const [bidAmount, setBidAmount] = useState("");
  const [sellPrice, setSellPrice] = useState("");
  const [sellAmount, setSellAmount] = useState("");
  const [lastBid, setLastBid] = useState(null);
  const [totalBids, setTotalBids] = useState({ count: 0, volume: 0 });
  // ... [previous useEffect and handlers remain the same]
  useEffect(() => {
    getInventoryHandler();
  }, []);
// Error handling with auto-dismiss
useEffect(() => {
  if (error) {
    const duration = 5000; // 5 seconds
    const interval = 50; // Update every 50ms
    const steps = duration / interval;
    let progress = 100;

    const timer = setInterval(() => {
      progress -= 100 / steps;
      setErrorProgress(Math.max(0, progress));

      if (progress <= 0) {
        clearInterval(timer);
        setError("");
        setErrorProgress(100);
      }
    }, interval);

    return () => {
      clearInterval(timer);
    };
  }
}, [error]);

  const getInventoryHandler = async () => {
    try {
      const inventory = await vmContract.methods.message().call();
      setInventory(inventory);
      console.log("Inventory:", inventory);
    } catch (err) {
      console.error(err.message);
      setError(err.message);
    }
  };

  const connectWalletHandler = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        const web3Instance = new Web3(window.ethereum);
        setWeb3(web3Instance);
        const account = accounts[0];
        setAccount(account);

        const networkId = await web3Instance.eth.net.getId();
        if (networkId !== 11155111n) {
          setError("Please connect to Sepolia network.");
          return;
        }
        console.log("Account connected: ", account);
      } catch (err) {
        console.error("Error connecting to wallet:", err);
        setError(err.message);
      }
    } else {
      setError("Please install MetaMask.");
    }
  };

  async function placeBid(amount, price, isProducer) {
    if (!web3 || !account) {
      setError("Web3 or account not initialized. Please connect your wallet.");
      return;
    }

    try {
      const accounts = await web3.eth.getAccounts();
      const account = accounts[0];

      const transaction = {
        from: account,
        to: closebid.options.address,
        data: closebid.methods
          .placeBid(parseInt(amount), parseInt(price), Boolean(isProducer))
          .encodeABI(),
        gas: 1000000,
      };

      const result = await web3.eth.sendTransaction(transaction);
      
      setLastBid({ amount, price, timestamp: new Date().toLocaleString() });
      setTotalBids(prev => ({ count: prev.count + 1, volume: prev.volume + parseInt(amount) }));

      console.log("Bid placed successfully:", result);
      return result;
    } catch (error) {
      console.error("Error placing bid:", error);
      setError(error.message);
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (role === "buyer") {
        await placeBid(buyAmount, bidAmount, false);
      } else {
        await placeBid(sellAmount, sellPrice, true);
      }
      await getInventoryHandler();
    } catch (err) {
      console.error(err.message);
      setError(err.message);
    }
  };

  const BidHistory = () => (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Trading History
      </h3>
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <History className="h-5 w-5 text-blue-500" />
            <span className="text-sm font-medium text-gray-700">Last Bid</span>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-sm text-gray-600">
              Amount: {lastBid.amount} kWh
            </div>
            <div className="text-sm text-gray-600">
              Price: {lastBid.price} ETH/kWh
            </div>
            <div className="text-xs text-gray-500">{lastBid.timestamp}</div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Coins className="h-5 w-5 text-green-500" />
            <span className="text-sm font-medium text-gray-700">
              Total Trading Activity
            </span>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-sm text-gray-600">
              Total Bids: {totalBids.count}
            </div>
            <div className="text-sm text-gray-600">
              Volume: {totalBids.volume} kWh
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-green-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <ArrowRightLeft className="h-6 w-6 text-teal-600" />
            <h1 className="text-xl font-bold text-gray-900">
              Energy Trading Platform
            </h1>
          </div>
          <button
            onClick={connectWalletHandler}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
              account
                ? "bg-teal-100 text-teal-700"
                : "bg-teal-600 text-white hover:bg-teal-700"
            }`}
          >
            <Wallet className="h-5 w-5" />
            <span>{account ? "Wallet Connected" : "Connect Wallet"}</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {error && (
          <div className="relative mb-4">
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div 
              className="absolute bottom-0 left-0 h-1 bg-red-600 transition-all duration-50"
              style={{ width: `${errorProgress}%` }}
            />
          </div>
        )}

        {/* Role Selection */}
        {!role && (
          <div className="grid md:grid-cols-2 gap-8 mt-8">
            <button
              onClick={() => setRole("buyer")}
              disabled={!account}
              className={`flex flex-col items-center p-8 bg-white rounded-xl shadow-lg transition-all
                ${
                  account
                    ? "hover:shadow-xl cursor-pointer"
                    : "opacity-50 cursor-not-allowed"
                }
              `}
            >
              <Battery className="h-16 w-16 text-teal-600 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900">Buy Energy</h2>
              <p className="mt-2 text-gray-600">Purchase energy from sellers</p>
              {!account && (
                <p className="mt-2 text-sm text-red-500">
                  Connect wallet to continue
                </p>
              )}
            </button>

            <button
              onClick={() => setRole("seller")}
              disabled={!account}
              className={`flex flex-col items-center p-8 bg-white rounded-xl shadow-lg transition-all
                ${
                  account
                    ? "hover:shadow-xl cursor-pointer"
                    : "opacity-50 cursor-not-allowed"
                }
              `}
            >
              <BatteryCharging className="h-16 w-16 text-teal-600 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900">Sell Energy</h2>
              <p className="mt-2 text-gray-600">Sell your excess energy</p>
              {!account && (
                <p className="mt-2 text-sm text-red-500">
                  Connect wallet to continue
                </p>
              )}
            </button>
          </div>
        )}

        {/* Trading Interface */}
        {role && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {role === "buyer" ? "Buy Energy" : "Sell Energy"}
                </h2>
                <button
                  onClick={() => setRole(null)}
                  className="text-teal-600 hover:text-teal-900"
                >
                  Change Role
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Amount (kWh)
                  </label>
                  <input
                    type="number"
                    value={role === "buyer" ? buyAmount : sellAmount}
                    onChange={(e) =>
                      role === "buyer"
                        ? setBuyAmount(e.target.value)
                        : setSellAmount(e.target.value)
                    }
                    className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 p-2 text-gray-900 placeholder-gray-400"
                    placeholder="Enter amount in kWh"
                    required
                  />
                </div>

                {role === "buyer" ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Bid Amount (ETH)
                    </label>
                    <input
                      type="number"
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 p-2 text-gray-900 placeholder-gray-400"
                      placeholder="Enter your bid"
                      required
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Cost per kWh (ETH)
                    </label>
                    <input
                      type="number"
                      value={sellPrice}
                      onChange={(e) => setSellPrice(e.target.value)}
                      className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 p-2 text-gray-900 placeholder-gray-400"
                      placeholder="Enter cost per kWh"
                      required
                    />
                  </div>
                )}

                <button
                  type="submit"
                  className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
                    ${
                      role === "buyer"
                        ? "bg-teal-600 hover:bg-teal-700"
                        : "bg-teal-600 hover:bg-teal-700"
                    }
                    ${!account && "opacity-50 cursor-not-allowed"}
                  `}
                  disabled={!account}
                >
                  {role === "buyer" ? "Place Bid" : "List for Sale"}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
