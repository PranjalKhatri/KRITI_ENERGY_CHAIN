"use client";

import { useState, useEffect } from "react";
import Web3 from "web3";
import {
  Wallet,
  Battery,
  BatteryCharging,
  ArrowRightLeft,
  ArrowUpCircle,
  ArrowDownCircle,
  History,
  Coins,
} from "lucide-react";
import { Alert, AlertDescription } from "../../components/alert";
import vmContract from "../../../blockchain/firstcontract";
import closebid from "../../../blockchain/closebid";
import { initialize } from "zokrates-js";

export default function VendingMachine() {
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
  const [currentPage, setCurrentPage] = useState("trading");
  const [walletBalance, setWalletBalance] = useState("0");
  const [transactionAmount, setTransactionAmount] = useState("");
  const [isDeposit, setIsDeposit] = useState(true);

  useEffect(() => {
    getInventoryHandler();
    if (account && web3) {
      updateWalletBalance();
    }
  }, [account, web3]);

  useEffect(() => {
    if (error) {
      const duration = 5000;
      const interval = 50;
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

  const ZokratesVerifier = async (balance, totalBidCost) => {
    initialize().then(async (zokratesProvider) => {
      const source =
        "def main(field balance, field totalBidCost) -> field {field res = balance >= totalBidCost ? 1 : 0; return res;}";
      // compilation
      const artifacts = zokratesProvider.compile(source);
      // computation
      const { witness, output } = zokratesProvider.computeWitness(artifacts, [
        balance,
        totalBidCost,
      ]);
      console.log("Witness:", witness);
      console.log("output:", output);
      // run setup
      const keypair = zokratesProvider.setup(artifacts.program);
      console.log("Keypair:", keypair);
      // generate proof
      const proof = zokratesProvider.generateProof(
        artifacts.program,
        witness,
        keypair.pk
      );

      // export solidity verifier
      //TODO: Get the verifier deployed on blockchain
      const verifier = zokratesProvider.exportSolidityVerifier(keypair.vk);
      console.log("Proof:", proof);
      console.log("Verifier:", verifier);
      try {
        const tx = await verifier.methods.verifyTx(proof.a,proof.b,proof.c,proof.inputs);
        await tx.wait();
        console.log("Proof verified successfully");
      } catch (error) {
        console.error("Error verifying proof:", error);
        setError(error.message);
      }
      // or verify off-chain
      // const isVerified = zokratesProvider.verify(keypair.vk, proof);
    });
  };

  const updateWalletBalance = async () => {
    try {
      const balance = await web3.eth.getBalance(account);
      setWalletBalance(web3.utils.fromWei(balance, "ether"));
    } catch (err) {
      console.error("Error fetching balance:", err);
      setError(err.message);
    }
  };

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

  const handleWalletTransaction = async (e) => {
    e.preventDefault();
    if (!web3 || !account) {
      setError("Please connect your wallet first");
      return;
    }

    try {
      const amountInWei = web3.utils.toWei(transactionAmount, "ether");

      if (isDeposit) {
        // Handle deposit (send ETH to contract)
        await web3.eth.sendTransaction({
          from: account,
          to: closebid.options.address,
          value: amountInWei,
        });
      } else {
        // Handle withdraw (call withdraw function on contract)
        // Note: Your smart contract needs a withdraw function
        await closebid.methods.withdraw(amountInWei).send({
          from: account,
        });
      }

      // Update balance after transaction
      await updateWalletBalance();
      setTransactionAmount("");
    } catch (err) {
      console.error("Transaction error:", err);
      setError(err.message);
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

      
      console.log(parseInt(amount) * parseInt(price));
      ZokratesVerifier(
        web3.utils.toWei(walletBalance.toString(), "ether"), // Convert walletBalance to Wei
        web3.utils.toWei(
          (parseInt(amount) * parseInt(price)).toString(),
          "ether"
        ) // Convert total cost to Wei
      );
      const transaction = {
        from: account,
        to: closebid.options.address,
        data: closebid.methods
        .placeBid(parseInt(amount), parseInt(price), Boolean(isProducer))
        .encodeABI(),
        gas: 2000000,
      };
      const result = await web3.eth.sendTransaction(transaction);
      setLastBid({
        amount,
        price,
        timestamp: new Date().toLocaleString(),
        type: isProducer,
      });
      setTotalBids((prev) => ({
        count: prev.count + 1,
        volume: prev.volume + parseInt(amount),
      }));

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
          {lastBid && (
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-sm text-gray-600">
                Amount: {lastBid.amount} kWh
              </div>
              <div className="text-sm text-gray-600">
                Price: {lastBid.price} ETH/kWh
              </div>
              <div className="text-xs text-gray-500">{lastBid.timestamp}</div>
              <div className="text-xs text-gray-500">
                Type: {lastBid.type == 0 ? "Buy" : "Sell"}
              </div>
            </div>
          )}
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

  const WalletPage = () => {
    if (!account) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <Wallet className="h-16 w-16 text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Connect Your Wallet
          </h2>
          <p className="text-gray-600">
            Please connect your wallet to access this feature
          </p>
        </div>
      );
    }

    return (
      <div className="max-w-2xl mx-auto">
        {/* Wallet Info */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Wallet Overview
          </h2>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <span className="text-sm font-medium text-gray-500">Balance</span>
              <div className="text-3xl font-bold text-gray-900">
                {walletBalance} ETH
              </div>
            </div>
            <div className="space-y-2">
              <span className="text-sm font-medium text-gray-500">
                Wallet Address
              </span>
              <div className="text-sm font-mono bg-gray-50 text-gray-700 p-2 rounded">
                {`${account.slice(0, 6)}...${account.slice(-4)}`}
              </div>
            </div>
          </div>
        </div>
        {/* Transaction Form */}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-green-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <ArrowRightLeft className="h-6 w-6 text-teal-600" />
              <h1 className="text-xl font-bold text-gray-900">
                Energy Trading Platform
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <nav className="flex space-x-4">
                <button
                  onClick={() => setCurrentPage("trading")}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    currentPage === "trading"
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Trading
                </button>
                <button
                  onClick={() => setCurrentPage("wallet")}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    currentPage === "wallet"
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Wallet
                </button>
              </nav>
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
          </div>
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

        {currentPage === "trading" ? (
          <>
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
                  <h2 className="text-2xl font-bold text-gray-900">
                    Buy Energy
                  </h2>
                  <p className="mt-2 text-gray-600">
                    Purchase energy from sellers
                  </p>
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
                  <h2 className="text-2xl font-bold text-gray-900">
                    Sell Energy
                  </h2>
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
                {account && lastBid && <BidHistory />}

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
          </>
        ) : (
          <WalletPage />
        )}
      </main>
    </div>
  );
}
