"use client";

import { useState, useEffect } from "react";
import Web3 from "web3";
import vmContract from "../../../blockchain/firstcontract";
import closebid from "../../../blockchain/closebid";

export default function VendingMachine() {
  const [error, setError] = useState("");
  const [inventory, setInventory] = useState("");
  const [amount, setAmount] = useState(0);
  const [role, setRole] = useState("buyer");
  const [bidAmount, setBidAmount] = useState("");
  const [buyAmount, setBuyAmount] = useState("");
  const [sellPrice, setSellPrice] = useState("");
  const [sellAmount, setSellAmount] = useState("");
  const [web3, setWeb3] = useState(null);
  const [account, setAccount] = useState(null);

  useEffect(() => {
    getInventoryHandler();
  }, []);

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
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
  
        // Initialize web3 instance after successful account request
        const web3Instance = new Web3(window.ethereum);
        setWeb3(web3Instance);
  
        const account = accounts[0];
        setAccount(account);
        console.log("Connected to account:", account);
  
        // Verify that you're on the Sepolia network
        const networkId = await web3Instance.eth.net.getId();
        console.log("Connected to network ID:", networkId);
        
        if (networkId !== 11155111n) {
          console.log("Please connect to Sepolia network.");
          return;
        } else {
          console.log("You're connected to Sepolia!");
        }
  
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
      console.error("Web3 or account not initialized. Please connect your wallet.");
      setError("Web3 or account not initialized. Please connect your wallet.");
      return;
    }
  
    console.log(await web3.eth.net.getId());
    console.log("Placing bid:", amount, price, isProducer);
  
    try {
      const accounts = await web3.eth.getAccounts();
      const account = accounts[0];
  
      // Manually create the transaction object
      const transaction = {
        from: account,
        to: closebid.options.address, // Contract address
        data: closebid.methods
          .placeBid(parseInt(amount), parseInt(price), Boolean(isProducer))
          .encodeABI(), // Encodes the data for the transaction
        gas: 1000000, // Adjust gas limit if needed
      };
  
      // Send the transaction using web3.eth.sendTransaction
      const result = await web3.eth.sendTransaction(transaction);
      
      console.log("Bid placed successfully:", result);
      return result;
    } catch (error) {
      console.error("Error placing bid:", error);
      setError(error.message);
    }
  }
  

  const bidAmountHandler = async () => {
    try {
      if (!web3) {
        console.error("Web3 not initialized. Please connect your wallet.");
        return;
      }
      const consumers = await closebid.methods.getConsumers().call();
      const bidContract = await placeBid(buyAmount, bidAmount, false);
      console.log("Bid contract:", bidContract);
      console.log("Consumers:", consumers);
    } catch (err) {
      console.error(err.message);
      setError(err.message);
    }
  };
  const sellAmountHandler = async () => {
    try {
      if (!web3) {
        console.error("Web3 not initialized. Please connect your wallet.");
        return;
      }
      if (!sellAmount || !sellPrice) {
        setError("Please fill in both amount and price to sell.");
        return;
      }
      // Call smart contract method for selling
      const sellerContract = await placeBid(sellAmount, sellPrice, true);
  
      console.log("Sell successful:", sellerContract);
      // Update the inventory or perform any other necessary actions
      await getInventoryHandler();  // To refresh inventory after the sale
  
    } catch (err) {
      console.error("Error selling amount:", err);
      setError(err.message);
    }
  };
  

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="navbar flex justify-between p-4 bg-gray-800">
        <div>
          <h2 className="text-3xl text-green-500 font-bold">Vending Machine</h2>
        </div>
        <button
          onClick={connectWalletHandler}
          className="bg-green-600 text-white px-6 py-3 rounded-lg text-lg hover:bg-green-700 transition duration-300"
        >
          Connect to Wallet
        </button>
      </nav>

      <section className="flex flex-col items-center justify-center py-10">
        <div className="container text-center mb-6">
          <h2 className="text-xl text-gray-700">
            Vending Machine Inventory: {inventory}
          </h2>
          {error && <p className="text-red-500 mt-4">{error}</p>}
        </div>

        <div className="mb-6">
          <button
            onClick={() => setRole("buyer")}
            className={`px-6 py-2 mr-4 ${
              role === "buyer" ? "bg-blue-600 text-white" : "bg-gray-300"
            }`}
          >
            Buyer
          </button>
          <button
            onClick={() => setRole("seller")}
            className={`px-6 py-2 ${
              role === "seller" ? "bg-blue-600 text-white" : "bg-gray-300"
            }`}
          >
            Seller
          </button>
        </div>

        {role === "buyer" ? (
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md w-72 text-center">
              <h3 className="text-2xl text-gray-800 mb-4">Your Bid Amount</h3>
              <input
                type="number"
                placeholder="Enter your bid"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-green-500"
                onChange={(e) => setBidAmount(e.target.value)}
                value={bidAmount}
              />
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md w-72 text-center">
              <h3 className="text-2xl text-gray-800 mb-4">Amount to Buy</h3>
              <input
                type="number"
                placeholder="Enter amount"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-green-500"
                onChange={(e) => setBuyAmount(e.target.value)}
                value={buyAmount}
              />
            </div>
            <button
              onClick={bidAmountHandler}
              className="bg-blue-500 text-white py-3 px-8 text-lg font-semibold rounded-lg transition-all duration-300 hover:bg-blue-600"
            >
              Buy
            </button>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md w-72 text-center">
              <h3 className="text-2xl text-gray-800 mb-4">Per KWh Cost</h3>
              <input
                type="number"
                placeholder="Enter cost"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-green-500"
                onChange={(e) => setSellPrice(e.target.value)}
                value={sellPrice}
              />
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md w-72 text-center">
              <h3 className="text-2xl text-gray-800 mb-4">Amount to Sell</h3>
              <input
                type="number"
                placeholder="Enter amount"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-green-500"
                onChange={(e) => setSellAmount(e.target.value)}
                value={sellAmount}
              />
            </div>
            <button onClick={sellAmountHandler} className="bg-green-500 text-white py-3 px-8 text-lg font-semibold rounded-lg transition-all duration-300 hover:bg-green-600">
              Sell
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
