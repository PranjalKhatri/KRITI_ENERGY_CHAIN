"use client";

import { useState, useEffect } from "react";
import Web3 from "web3";
import {
  Wallet,
  Battery,
  BatteryCharging,
  ArrowRightLeft,
  ArrowLeftRight,
  Building2,
  ArrowUpCircle,
  ArrowDownCircle,
  History,
  Coins,
} from "lucide-react";
import { Alert, AlertDescription } from "../../components/alert";
import vmContract from "../../../blockchain/firstcontract";
import closebid from "../../../blockchain/closebid";
import executeEnergy from "../../../blockchain/executeEnergy";
import buyersBalance from "../../../blockchain/buyersBalance";
import { initialize } from "zokrates-js";
import axios from "axios";
import { loadProvingKey, loadArtifacts } from "./artifactLoader";

export default function VendingMachine() {
  const [error, setError] = useState("");
  const [errorProgress, setErrorProgress] = useState(100);
  const [inventory, setInventory] = useState("");
  const [role, setRole] = useState(null);
  const [web3, setWeb3] = useState(null);
  const [account, setAccount] = useState(null);

  const [currentPage, setCurrentPage] = useState("trading");
  const [buyAmount, setBuyAmount] = useState("");
  const [bidAmount, setBidAmount] = useState("");
  const [sellPrice, setSellPrice] = useState("");
  const [sellAmount, setSellAmount] = useState("");
  const [lastBid, setLastBid] = useState(null);
  const [totalBids, setTotalBids] = useState({ count: 0, volume: 0 });

  const [walletBalance, setWalletBalance] = useState("0");

  const [transactionAmount, setTransactionAmount] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [isDeposit, setIsDeposit] = useState(true);
  const [depositAmount, setDepositAmount] = useState(0);
  const [tradingMode, setTradingMode] = useState("p2p"); // "p2p" or "dso"

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

  useEffect(() => {
    if (!account) return;

    const fetchBalance = async () => {
      updateWalletBalance();
      // const consumerBalance = await getContractBalance();
      // console.log("Updated Balance:", consumerBalance);
    };

    fetchBalance(); // Run immediately

    const interval = setInterval(fetchBalance, 10000); // Run every 10 seconds

    return () => clearInterval(interval); // Cleanup on unmount or account change
  }, [account]);

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
        const tx = await verifier.methods.verifyTx(
          proof.a,
          proof.b,
          proof.c,
          proof.inputs
        );
        await tx.wait();
        console.log("Proof verified successfully");
      } catch (error) {
        console.error("Error verifying proof:", error);
        setError(error instanceof Error ? error.message : String(error));
      }
      // or verify off-chain
      // const isVerified = zokratesProvider.verify(keypair.vk, proof);
    });
  };

  const buyersBalanceVerifier = async (balance, totalBidCost) => {
    initialize().then(async (zokratesProvider) => {
      const artifacts = await loadArtifacts("buyersbalance/Buyersbalance_out");
      const provingKey = await loadProvingKey("buyersbalance/proving.key");

      if (!artifacts || !provingKey) {
        console.error("Failed to load artifacts or proving key.");
        return;
      }

      console.log("Artifacts:", artifacts);
      console.log("Proving Key:", provingKey);

      try {
        // Compute witness
        const { witness, output } = await zokratesProvider.computeWitness(
          artifacts,
          [balance, totalBidCost]
        );

        console.log("Witness:", witness);
        console.log("Output:", output);

        // Generate proof using the proving key
        const proof = zokratesProvider.generateProof(
          artifacts.program,
          witness,
          provingKey
        );
        const verifierABI = [
          {
            inputs: [
              {
                components: [
                  {
                    components: [
                      {
                        internalType: "uint256",
                        name: "X",
                        type: "uint256",
                      },
                      {
                        internalType: "uint256",
                        name: "Y",
                        type: "uint256",
                      },
                    ],
                    internalType: "struct Pairing.G1Point",
                    name: "a",
                    type: "tuple",
                  },
                  {
                    components: [
                      {
                        internalType: "uint256[2]",
                        name: "X",
                        type: "uint256[2]",
                      },
                      {
                        internalType: "uint256[2]",
                        name: "Y",
                        type: "uint256[2]",
                      },
                    ],
                    internalType: "struct Pairing.G2Point",
                    name: "b",
                    type: "tuple",
                  },
                  {
                    components: [
                      {
                        internalType: "uint256",
                        name: "X",
                        type: "uint256",
                      },
                      {
                        internalType: "uint256",
                        name: "Y",
                        type: "uint256",
                      },
                    ],
                    internalType: "struct Pairing.G1Point",
                    name: "c",
                    type: "tuple",
                  },
                ],
                internalType: "struct Verifier.Proof",
                name: "proof",
                type: "tuple",
              },
              {
                internalType: "uint256[3]",
                name: "input",
                type: "uint256[3]",
              },
            ],
            name: "verifyTx",
            outputs: [
              {
                internalType: "bool",
                name: "r",
                type: "bool",
              },
            ],
            stateMutability: "view",
            type: "function",
          },
        ];
        let verifier = new web3.eth.Contract(
          verifierABI,
          "0x64D8EDDf2ECb86F876D33af4CBfAB4F981Ce43Fd",
          {
            from: account, // default from address
            gasPrice: "2000000000000", // default gas price in wei
          }
        );
        console.log("Generated Proof:", proof);
        const gasPrice = await web3.eth.getGasPrice();
        console.log("Current gas price:", gasPrice);
        // Get account balance
        const balance_ = await web3.eth.getBalance(account);
        console.log(
          "Account balance:",
          web3.utils.fromWei(balance_, "ether"),
          "ETH"
        );

        // Estimate gas for the transaction
        const gasEstimate = await verifier.methods
          .verifyTx(proof.proof, proof.inputs)
          .estimateGas({ from: account });

        console.log("Estimated gas:", gasEstimate);

        // Add 20% buffer to gas estimate
        const gasLimit = Math.ceil(Number(gasEstimate) * 1.2); // Converts gasEstimate to a regular number

        // Calculate total cost
        const totalCost = BigInt(gasPrice) * BigInt(gasLimit);
        console.log("Total gas cost in wei:", totalCost.toString());

        // Convert total cost to ether:
        const totalCostInEther = web3.utils.fromWei(
          totalCost.toString(),
          "ether"
        );
        console.log("Estimated total cost in ether:", totalCostInEther);

        let result = await verifier.methods
          .verifyTx(proof.proof, proof.inputs)
          .call({ from: account });
        // Verify proof on-chain
        //   const verifier = buyersBalance; // Ensure this is an initialized contract instance
        //   if (!verifier) {
        //     console.error("Verifier contract instance is not set.");
        //     return;
        //   }

        //   // const tx = await verifier.methods
        //   //   .verifyTx(
        //   //     proof.proof,
        //   //     proof.inputs
        //   //   )
        //   // const result = await verifier.methods
        //   //   .verifyTx(proof.inputs, proof.proof)
        //   //   .call();
        //   const tx = {
        //     from: account,
        //     to: buyersBalance.options.address,
        //     data: buyersBalance.methods.verifyTx(
        //       {
        //         a: proof.proof.a, // ✅ Struct format is correct
        //         b: proof.proof.b,
        //         c: proof.proof.c
        //       },
        //       proof.inputs // ✅ Ensure this is an array of length 3
        //     ).encodeABI(),
        //     gas: 3000000,
        //   };

        //   const result = await web3.eth.sendTransaction(tx);
        //   console.log("Proof verification transaction sent:", result);

        // console.log("Proof verified successfully:", tx);
      } catch (error) {
        console.error("Error verifying proof:", error);
      }
    });
  };

  const updateWalletBalance = async () => {
    try {
      const balance = await web3.eth.getBalance(account);
      setWalletBalance(web3.utils.fromWei(balance, "ether"));
    } catch (err) {
      console.error("Error fetching balance:", err);
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const fetchUserTransactions = async (userId) => {
    console.log("string userid ", toString(userId));
    try {
      // 🔹 Create a user if they don't exist
      await axios.post(`http://localhost:8000/api/v1/users/create`, {
        accountNumber: userId, // Assuming `userId` is the account number
        name: "Pranjal", // You might need to get this dynamically
        email: `pranjal@gmail.com`, // Provide a default email
      });
    } catch (err) {
      console.log("Error in user (duplication probably)");
      console.error(err);
    }
    try {
      // 🔹 Fetch transactions for the user
      const response = await axios.get(
        `http://localhost:8000/api/v1/transactions/user/${userId}`
      );
      console.log(response.data);
      setTransactions(response.data); // Store transactions in state
    } catch (error) {
      console.error("Error fetching transactions:", error);
      setError(error.response?.data?.message || "Could not fetch transactions");
    }
  };

  const createTransaction = async (
    energyAmount,
    pricePerUnit,
    transactionType
  ) => {
    try {
      // Transaction payload
      const transactionData = {
        accountNumber: account,
        energyAmount: energyAmount,
        pricePerUnit: pricePerUnit,
        transactionType: transactionType,
      };

      // ✅ Send the transaction to backend API
      const response = await axios.post(
        "http://localhost:8000/api/v1/transactions/create",
        transactionData,
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      console.log("Transaction Created:", response.data);
      fetchUserTransactions(account); // Fetch updated transactions
      return response.data; // Return the created transaction
    } catch (error) {
      console.error("Error creating transaction:", error);
      throw new Error(
        error.response?.data?.message || "Transaction creation failed"
      );
    }
  };

  const getInventoryHandler = async () => {
    try {
      const inventory = await vmContract.methods.message().call();
      setInventory(inventory);
      console.log("Inventory:", inventory);
    } catch (err) {
      console.error(err.message);
      setError(err instanceof Error ? err.message : String(err));
    }
  };
  const getContractBalance = async () => {
    if (!web3 || !executeEnergy || !account) {
      setError(
        "Web3, contract, or account not initialized. Connect your wallet first."
      );
      return;
    }

    try {
      // Correct call without gas or encodeABI()
      const balance = await executeEnergy.methods.getBalance(account).call();

      console.log(
        "User Contract Balance:",
        web3.utils.fromWei(balance, "ether")
      );
      return web3.utils.fromWei(balance, "ether"); // Convert from Wei to ETH
    } catch (err) {
      console.error("Error fetching contract balance:", err);
      setError(err instanceof Error ? err.message : String(err));
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
        fetchUserTransactions(account);
      } catch (err) {
        console.error("Error connecting to wallet:", err);
        setError(err instanceof Error ? err.message : String(err));
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
      setError(err instanceof Error ? err.message : String(err));
    }
  };
  const withdrawFunds = async () => {
    if (!web3 || !executeEnergy || !account) {
      setError("Web3, contract, or account not initialized.");
      return;
    }

    try {
      // Fetch user balance in contract before withdrawal
      const balanceWei = await executeEnergy.methods.getBalance(account).call();
      const balanceETH = web3.utils.fromWei(balanceWei, "ether");

      console.log(`User Contract Balance: ${balanceETH} ETH`);

      // Prevent transaction if balance is 0
      if (parseFloat(balanceETH) === 0) {
        setError("Insufficient funds in contract to withdraw.");
        return;
      }

      // Fetch the contract's total ETH balance
      const contractBalanceWei = await web3.eth.getBalance(
        executeEnergy.options.address
      );
      const contractBalanceETH = web3.utils.fromWei(
        contractBalanceWei,
        "ether"
      );

      console.log(`Contract ETH Balance: ${contractBalanceETH} ETH`);

      // Prevent transaction if contract itself has insufficient ETH
      if (parseFloat(contractBalanceETH) < parseFloat(balanceETH)) {
        setError("Contract does not have enough ETH to process withdrawal.");
        return;
      }

      // Execute withdrawal transaction
      const transaction = await executeEnergy.methods.withdrawFunds().send({
        from: account,
        gas: 3000000,
      });

      console.log("Withdraw Transaction Hash:", transaction.transactionHash);

      // Refresh user balance after withdrawal
      await getContractBalance();
    } catch (err) {
      console.error("Error withdrawing funds:", err);
      setError(err.message || "Withdrawal failed");
    }
  };

  async function depositFunds(amountInWei) {
    console.log(depositAmount);
    console.log("Depositing amount:", amountInWei);
    try {
      const accounts = await web3.eth.getAccounts();
      const sender = accounts[0];

      // Get the function data for depositFunds
      const data = executeEnergy.methods.depositFunds().encodeABI();

      const transaction = {
        from: sender,
        to: executeEnergy.options.address,
        value: amountInWei,
        gas: 3000000,
        data: data, // Include the encoded function call data
      };

      const result = await web3.eth.sendTransaction(transaction);
      console.log("Transaction hash:", result.transactionHash);

      const contractBalance = await web3.eth.getBalance(
        executeEnergy.options.address
      );
      console.log("Contract ETH Balance:", contractBalance);

      return result;
    } catch (error) {
      console.error("Error depositing funds:", error);
      throw error;
    }
  }

  async function placeBid(amount, price, isProducer) {
    if (!web3 || !account) {
      setError("Web3 or account not initialized. Please connect your wallet.");
      return;
    }

    try {
      const accounts = await web3.eth.getAccounts();
      const account = accounts[0];

      console.log(amount * price);
      //{ ZOKRATES }------------------------------
      console.log(
        web3.utils.toWei(walletBalance.toString(), "ether"), // Convert walletBalance to Wei
        web3.utils.toWei((amount * price).toString(), "ether")
      );
      buyersBalanceVerifier(
        web3.utils.toWei(walletBalance.toString(), "ether"), // Convert walletBalance to Wei
        web3.utils.toWei((amount * price).toString(), "ether") // Convert total cost to Wei
      );
      //{ZOKRATES}--------------------------------
      const transaction = {
        from: account,
        to: closebid.options.address,
        data: closebid.methods
          .placeBid(
            amount,
            web3.utils.toWei(price.toString(), "ether"),
            Boolean(isProducer)
          )
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

      // depositFunds(web3.utils.toWei((amount * price).toString(), "ether"));

      createTransaction(amount, price, isProducer ? "sell" : "buy");

      return result;
    } catch (err) {
      console.error("Error placing bid:", err);
      setError(err instanceof Error ? err.message : String(err));
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
      setError(err instanceof Error ? err.message : String(err));
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
    // Temporary test transaction
    const testTransaction = [
      {
        _id: "test123",
        energyAmount: 50,
        pricePerUnit: 0.05,
        totalPrice: 2.5,
        transactionType: "buy",
        timestamp: new Date().toISOString(),
      },
    ];

    // Use test transactions if transactions array is empty
    const displayTransactions = transactions;
    // transactions.length > 0 ? transactions : testTransaction;

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

        {/* Transactions Table */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Transactions</h2>
          {displayTransactions.length === 0 ? (
            <p className="text-gray-500">No transactions found.</p>
          ) : (
            <table className="w-full border-collapse border border-gray-200">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-2">Energy</th>
                  <th className="border border-gray-300 px-4 py-2">
                    Price/Unit
                  </th>
                  <th className="border border-gray-300 px-4 py-2">
                    Total Price
                  </th>
                  <th className="border border-gray-300 px-4 py-2">Type</th>
                  <th className="border border-gray-300 px-4 py-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {displayTransactions.map((tx) => (
                  <tr key={tx._id} className="text-center">
                    <td className="border border-gray-300 px-4 py-2">
                      {tx.energyAmount} kWh
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {tx.pricePerUnit} ETH
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {tx.totalPrice} ETH
                    </td>
                    <td
                      className={`border border-gray-300 px-4 py-2 font-bold ${
                        tx.transactionType === "buy"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {tx.transactionType.toUpperCase()}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {new Date(tx.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  };

  const buyFromDSO = async (energyAmount) => {
    if (!web3 || !account) {
      setError("Web3 or account not initialized. Please connect your wallet.");
      return;
    }
    // const price =
    try {
      const accounts = await web3.eth.getAccounts();
      const account = accounts[0];
      // console.log("Total cost in ETH:", amount * price);

      const transaction = {
        from: account,
        to: executeEnergy.options.address,
        data: executeEnergy.methods.buyEnergyFromDSO(energyAmount).encodeABI(),
        gas: 2000000,
        value: energyAmount,
      };

      const result = await web3.eth.sendTransaction(transaction);
      console.log("Energy purchase successful:", result);

      return result;
    } catch (err) {
      console.error("Error buying energy:", err);
      setError(err instanceof Error ? err.message : String(err));
    }
  };
  const SellToDSO = async (energyAmount) => {
    if (!web3 || !account) {
      setError("Web3 or account not initialized. Please connect your wallet.");
      return;
    }
    // const price =
    try {
      const accounts = await web3.eth.getAccounts();
      const account = accounts[0];
      // console.log("Total cost in ETH:", amount * price);

      const transaction = {
        from: account,
        to: executeEnergy.options.address,
        data: executeEnergy.methods.sellEnergyToDSO(energyAmount).encodeABI(),
        gas: 2000000,
        value: energyAmount,
      };

      const result = await web3.eth.sendTransaction(transaction);
      console.log("Energy Selling successful:", result);

      return result;
    } catch (err) {
      console.error("Error Selling energy:", err);
      setError(err instanceof Error ? err.message : String(err));
    }
  };
  const gimmeMoney = async () => {
    try {
      const accounts = await web3.eth.getAccounts();
      const sender = accounts[0];

      // Get the function data for depositFunds
      const data = executeEnergy.methods.executeEnergyExchange().encodeABI();

      const transaction = {
        from: sender,
        to: executeEnergy.options.address,
        // value: amountInWei,
        gas: 3000000,
        data: data, // Include the encoded function call data
      };

      const result = await web3.eth.sendTransaction(transaction);
      console.log("Transaction hash:", result.transactionHash);

      const contractBalance = await web3.eth.getBalance(
        executeEnergy.options.address
      );
      console.log("Contract ETH Balance:", contractBalance);

      return result;

      // Alternative Method 2: Using sendTransaction with encoded data
      // const data = executeEnergy.methods.executeEnergyExchange().encodeABI();
      // const tx = await web3.eth.sendTransaction({
      //     from: sender,
      //     to: executeEnergy.options.address,
      //     gas: 3000000,
      //     data: data
      // });

      // Log events if any were emitted
      if (tx.events) {
        if (tx.events.EnergyCleared) {
          const event = tx.events.EnergyCleared;
          console.log("Energy Cleared Event:", {
            producer: event.returnValues.producer,
            consumer: event.returnValues.consumer,
            amount: event.returnValues.amount,
            price: event.returnValues.price,
          });
        }

        if (tx.events.PaymentProcessed) {
          const event = tx.events.PaymentProcessed;
          console.log("Payment Processed Event:", {
            payer: event.returnValues.payer,
            receiver: event.returnValues.receiver,
            amount: event.returnValues.amount,
            totalCost: event.returnValues.totalCost,
          });
        }

        if (tx.events.DSOTransaction) {
          const event = tx.events.DSOTransaction;
          console.log("DSO Transaction Event:", {
            entity: event.returnValues.entity,
            amount: event.returnValues.amount,
            price: event.returnValues.price,
            isSelling: event.returnValues.isSelling,
          });
        }
      }

      // Get updated contract state
      const DSOEnergy = await executeEnergy.methods.getDSOEnergy().call();
      const DSOBalance = await executeEnergy.methods.getDSOETHBalance().call();

      console.log("Updated DSO Energy:", DSOEnergy);
      console.log("Updated DSO ETH Balance:", DSOBalance);

      return tx;
    } catch (error) {
      console.error("Error executing energy exchange:", error);
      if (error.message.includes("revert")) {
        // Handle specific revert reasons if provided by the contract
        console.error("Contract reverted:", error.message);
      }
      throw error;
    }
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
        {/* ERROR BAR */}
        {error && (
          <div className="relative mb-4">
            <div className="bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
            <div
              className="absolute bottom-0 left-0 h-1 bg-red-600 transition-all duration-50"
              style={{ width: `${errorProgress}%` }}
            />
          </div>
        )}

        {currentPage === "trading" ? (
          <>
            {/* Trading Mode Selection */}
            {!role && (
              <div className="mb-8">
                <div className="flex justify-center space-x-4 p-4 bg-white rounded-lg shadow-sm">
                  <button
                    onClick={() => setTradingMode("p2p")}
                    className={`px-6 py-3 rounded-lg flex items-center space-x-2 ${
                      tradingMode === "p2p"
                        ? "bg-teal-100 text-teal-800"
                        : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <ArrowLeftRight className="h-5 w-5" />
                    <span>Peer-to-Peer Trading</span>
                  </button>
                  <button
                    onClick={() => setTradingMode("dso")}
                    className={`px-6 py-3 rounded-lg flex items-center space-x-2 ${
                      tradingMode === "dso"
                        ? "bg-teal-100 text-teal-800"
                        : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <Building2 className="h-5 w-5" />
                    <span>DSO Trading</span>
                  </button>
                </div>
              </div>
            )}
            {/* Role Selection */}
            {!role && tradingMode === "p2p" && (
              <div className="grid md:grid-cols-2 gap-8 mt-8">
                <button
                  onClick={() => setRole("buyer")}
                  disabled={!account}
                  className={`flex flex-col items-center p-8 bg-white rounded-xl shadow-lg transition-all ${
                    account
                      ? "hover:shadow-xl cursor-pointer"
                      : "opacity-50 cursor-not-allowed"
                  }`}
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
                  className={`flex flex-col items-center p-8 bg-white rounded-xl shadow-lg transition-all ${
                    account
                      ? "hover:shadow-xl cursor-pointer"
                      : "opacity-50 cursor-not-allowed"
                  }`}
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
            {/* DSO Trading Interface */}
            {!role && tradingMode === "dso" && (
              <div className="grid md:grid-cols-2 gap-8 mt-8">
                <div className="bg-white rounded-xl shadow-lg p-8">
                  <div className="text-center mb-6">
                    <Building2 className="h-16 w-16 text-teal-600 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900">
                      Buy from DSO
                    </h2>
                    <p className="mt-2 text-gray-600">
                      Current DSO Rate: 0.15 ETH/kWh
                    </p>
                  </div>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      buyFromDSO(buyAmount);
                    }}
                    className="space-y-6"
                  >
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Amount (kWh)
                      </label>
                      <input
                        type="number"
                        value={buyAmount}
                        onChange={(e) => setBuyAmount(e.target.value)}
                        className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 p-2"
                        placeholder="Enter amount to buy"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50"
                      disabled={!account}
                    >
                      Buy from DSO
                    </button>
                  </form>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-8">
                  <div className="text-center mb-6">
                    <Building2 className="h-16 w-16 text-teal-600 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900">
                      Sell to DSO
                    </h2>
                    <p className="mt-2 text-gray-600">
                      Current DSO Buy Rate: 0.12 ETH/kWh
                    </p>
                  </div>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      SellToDSO(sellAmount);
                    }}
                    className="space-y-6"
                  >
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Amount (kWh)
                      </label>
                      <input
                        type="number"
                        value={sellAmount}
                        onChange={(e) => setSellAmount(e.target.value)}
                        className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 p-2"
                        placeholder="Enter amount to sell"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50"
                      disabled={!account}
                    >
                      Sell to DSO
                    </button>
                  </form>
                </div>
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
                      <>
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
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Deposit Amount (ETH)
                          </label>
                          <input
                            type="number"
                            value={depositAmount}
                            onChange={(e) => setDepositAmount(e.target.value)}
                            className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 p-2"
                            placeholder="Enter deposit amount"
                            required
                          />
                        </div>
                        <div className="flex space-x-4">
                          <button
                            type="submit"
                            className="flex-1 py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={!account}
                          >
                            Place Bid
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              depositFunds(
                                web3.utils.toWei(
                                  depositAmount.toString(),
                                  "ether"
                                )
                              );
                            }}
                            className="flex-1 py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={!account}
                          >
                            Deposit Funds
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
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
                        <button
                          type="submit"
                          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={!account}
                        >
                          List for Sale
                        </button>
                      </>
                    )}
                  </form>
                </div>
              </div>
            )}
          </>
        ) : (
          <WalletPage />
        )}
      </main>
      <button onClick={withdrawFunds}>EXECUTE ENERGY</button>
    </div>
  );
}
