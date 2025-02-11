"use client";

//#region {IMPORTS}
import { useState, useEffect } from "react";
import Web3, { BlockTags } from "web3";
import {
  RefreshCcw,
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
import energyReserve from "../../../blockchain/energyReserve";
import { initialize } from "zokrates-js";
import axios from "axios";
import { loadProvingKey, loadArtifacts } from "./artifactLoader";
//#endregion

export default function VendingMachine() {
 
  //#region {STATES}
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
  const [contractBalance, setContractBalance] = useState(0);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [currentEnergy, setCurrentEnergy] = useState(100);

  //#endregion

  //#region {USE EFFECTS}
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
      await getEnergyBalanceFromContract();
      getContractBalance();
      // console.log("updated energy");
      // console.log("Updated Balance:", walletBalance);
      // const consumerBalance = await getContractBalance();
      // console.log("Updated Balance:", consumerBalance);
    };

    fetchBalance(); // Run immediately

    const interval = setInterval(fetchBalance, 5000); // Run every k seconds

    return () => clearInterval(interval); // Cleanup on unmount or account change
  }, [account]);
  
  //#endregion


  const setEnergyBalanceServer = async (amnt) => {
    console.log("Updating energy balance in server:", amnt);

    if (!account) {
      console.log("Account is undefined. Cannot update energy.");
      return false;
    }

    let parsedAmount = Number(amnt);
    if (parsedAmount == 0) parsedAmount = 100;
    if (isNaN(parsedAmount)) {
      console.log("Invalid energy amount:", amnt);
      return false;
    }

    try {
      const response = await axios.put(
        `http://localhost:8000/api/v1/users/${account}/energy`, // API endpoint
        { energy: parsedAmount }, // Send parsed number
        { headers: { "Content-Type": "application/json" } } // Headers
      );

      console.log("Energy Updated Successfully:", response.data);
      return response.data;
    } catch (error) {
      console.log(
        "Error updating energy in Server:",
        error.response?.data || error.message
      );
      return false;
    }
  };

  const getEnergyBalanceFromContract = async () => {
    try {
      const energyBalance = await executeEnergy.methods
        .energyBalance(account)
        .call();
      console.log("Energy Balance:", energyBalance);
      if (parseInt(energyBalance) !== 0) {
        setCurrentEnergy(energyBalance);
        setEnergyBalanceServer(energyBalance);
      }
      return energyBalance;
    } catch (err) {
      console.log("Error fetching energy balance:", err);
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  //#region {ZK-VERIFIERS}
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
        console.log("Error verifying proof:", error);
        setError(error instanceof Error ? error.message : String(error));
      }
      // or verify off-chain
      // const isVerified = zokratesProvider.verify(keypair.vk, proof);
    });
  };

  const buyersBalanceVerifier = async (balance, totalBidCost) => {
    try {
      // Initialize ZoKrates provider
      const zokratesProvider = await initialize();

      const artifacts = await loadArtifacts("buyersbalance/Buyersbalance_out");
      const provingKey = await loadProvingKey("buyersbalance/proving.key");

      if (!artifacts || !provingKey) {
        console.log("Failed to load artifacts or proving key.");
        return false; // Return false if artifacts or proving key are not found
      }

      console.log("Artifacts:", artifacts);
      console.log("Proving Key:", provingKey);

      // Compute witness
      const { witness, output } = await zokratesProvider.computeWitness(
        artifacts,
        [balance, totalBidCost]
      );
      console.log("Witness:", witness);
      console.log("Output:", output);

      // Generate proof using the proving key
      const proof = await zokratesProvider.generateProof(
        artifacts.program,
        witness,
        provingKey
      );
      console.log("Generated Proof:", proof);

      // Get the buyersBalance contract instance (Make sure this contract is already imported)
      const buyersBalanceContract = buyersBalance; // Assuming buyersBalance is already imported

      // Estimate gas for verifying the proof
      const gasPrice = await web3.eth.getGasPrice();
      console.log("Current gas price:", gasPrice);

      const balance_ = await web3.eth.getBalance(account);
      console.log(
        "Account balance:",
        web3.utils.fromWei(balance_, "ether"),
        "ETH"
      );

      // Estimate gas for the transaction
      const gasEstimate = await buyersBalanceContract.methods
        .verifyTx(proof.proof, proof.inputs)
        .estimateGas({ from: account });

      console.log("Estimated gas:", gasEstimate);

      // Add buffer to gas estimate
      const gasLimit = Math.ceil(Number(gasEstimate) * 1.2); // 20% buffer
      const totalCost = BigInt(gasPrice) * BigInt(gasLimit);
      console.log("Total gas cost in wei:", totalCost.toString());

      // Verify proof transaction
      const result = await buyersBalanceContract.methods
        .verifyTx(proof.proof, proof.inputs)
        .call({ from: account });

      console.log("Proof verification result:", result);
      return result; // Return the result of the proof verification (true/false)
    } catch (error) {
      console.log("Error verifying proof:", error);
      return false; // If there's an error, return false
    }
  };
  const energyReserveVerifier = async (sellerReserve, sellingAmount) => {
    try {
      // Initialize ZoKrates provider
      const zokratesProvider = await initialize();

      const artifacts = await loadArtifacts("energyReserve/energyreserve_out");
      const provingKey = await loadProvingKey(
        "energyReserve/energyreserve_proving.key"
      );

      if (!artifacts || !provingKey) {
        console.log("Failed to load artifacts or proving key.");
        return false; // Return false if artifacts or proving key are not found
      }

      console.log("Artifacts:", artifacts);
      console.log("Proving Key:", provingKey);
      console.log("params", "" + sellerReserve, "" + sellingAmount);
      // Compute witness
      const { witness, output } = await zokratesProvider.computeWitness(
        artifacts,
        [sellerReserve, sellingAmount]
      );
      console.log("Witness:", witness);
      console.log("Output:", output);
      console.log("output int ", typeof output);
      // console.log("ouptut at pos ",output[0],"1",output[1],"2",output[2],"3",output[3],"4",output[4],"5",output[5]);
      if (output[5] === "0") return false; // Ensures valid comparison
      // Generate proof using the proving key
      const proof = await zokratesProvider.generateProof(
        artifacts.program,
        witness,
        provingKey
      );
      console.log("Generated Proof:", proof);

      // Get the buyersBalance contract instance (Make sure this contract is already imported)
      const energyReserveVerifierContract = energyReserve; // Assuming buyersBalance is already imported
      // Verify proof transaction
      const result = await energyReserveVerifierContract.methods
        .verifyTx(proof.proof, proof.inputs)
        .call({ from: account });

      console.log("Proof verification result Seller:", result);
      return result; // Return the result of the proof verification (true/false)
    } catch (error) {
      console.log("Error verifying proof:", error);
      return false; // If there's an error, return false
    }
  };

  //#endregion
  
  //#region {WALLET-FUNCTIONS}

  const updateWalletBalance = async () => {
    try {
      const balance = await web3.eth.getBalance(account);
      setWalletBalance(web3.utils.fromWei(balance, "ether"));
    } catch (err) {
      console.log("Error fetching balance:", err);
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const fetchUserTransactions = async (userId) => {
    console.log("string userid ", toString(userId));
    try {
      // 🔹 Create a user if they don't exist
      await axios.post(`http://localhost:8000/api/v1/users/create`, {
        accountNumber: userId, // Assuming `userId` is the account number
        name: "Pranjalanna", // You might need to get this dynamically
        email: `${userId}@energychain.com`, // Provide a default email
      });
    } catch (err) {
      console.log("Error in user (duplication probably)");
      console.log(err);
    }
    const resp = await axios.get(
      `http://localhost:8000/api/v1/users/${userId}`
    );
    setCurrentEnergy(resp.data.energy);
    console.log(resp);
    try {
      // 🔹 Fetch transactions for the user
      const response = await axios.get(
        `http://localhost:8000/api/v1/transactions/user/${userId}`
      );
      console.log(response.data);
      setTransactions(response.data); // Store transactions in state
    } catch (error) {
      console.log("Error fetching transactions:", error);
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
      console.log("Error creating transaction:", error);
      throw new Error(
        error.response?.data?.message || "Transaction creation failed"
      );
    }
  };

  const getInventoryHandler = async () => {
    try {
      // const inventory = await vmContract.methods.message().call();
      // setInventory(inventory);
      // console.log("Inventory:", inventory);
    } catch (err) {
      console.log(err.message);
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
      const userBalanceInMapping = await executeEnergy.methods
        .balances(account)
        .call();
      console.log(
        "User balance in mapping:",
        web3.utils.fromWei(userBalanceInMapping, "ether")
      );
      setContractBalance(web3.utils.fromWei(userBalanceInMapping, "ether"));
      // consolele
      console.log("User balance in mapping:", userBalanceInMapping);
      return web3.utils.fromWei(userBalanceInMapping, "ether"); // Convert from Wei to ETH
    } catch (err) {
      console.log("Error fetching contract balance:", err);
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
        if (networkId !== 1337) {
          try {
            await window.ethereum.request({
              method: "wallet_switchEthereumChain",
              params: [{ chainId: "0x539" }], // 1337 in hex
            });
            console.log("Switched to Ganache network.");
            setError(null);
          } catch (switchError) {
            console.log("Error switching network:", switchError);
            setError("Please switch to Ganache manually.");
          }
          //   return;
        }
        //TODO
        // if (networkId !== 11155111n) {
        //   setError("Please connect to Sepolia network.");
        //   return;
        // }
        console.log("Account connected: ", account);
        fetchUserTransactions(account);
      } catch (err) {
        console.log("Error connecting to wallet:", err);
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
      console.log("Transaction error:", err);
      setError(err instanceof Error ? err.message : String(err));
    }
  };
  const withdrawFunds = async () => {
    if (!web3 || !executeEnergy || !account) {
      setError("Web3, contract, or account not initialized.");
      return;
    }

    try {
      setIsWithdrawing(true);
      // Check user balance in mapping
      getContractBalance();

      // Check contract's ETH balance
      const contractETH = await web3.eth.getBalance(
        executeEnergy.options.address
      );
      console.log(
        "Contract ETH balance:",
        web3.utils.fromWei(contractETH, "ether")
      );
      // setIsWithdrawing(true);
      // Use send method to directly call the withdrawal
      const txReceipt = await executeEnergy.methods.withdrawFunds().send({
        from: account,
        // Optional: You can specify gas limit if needed
        // gas: estimatedGas
      });

      console.log("Withdrawal successful:", txReceipt.transactionHash);
      setIsWithdrawing(false);
      getContractBalance();
      updateWalletBalance();
      return txReceipt;
    } catch (err) {
      console.log("Withdrawal error:", err);
      setError(err.message);
      setIsWithdrawing(false);
      throw err;
    }
  };
  //#endregion
  
  //#region {BID-FUNCTIONS}

  async function depositFunds(amountInWei) {
    console.log(depositAmount);
    console.log("Depositing amount:", amountInWei);
    try {
      // const accounts = await web3.eth.getAccounts();
      // const sender = accounts[0];
      const sender = account;
      // Get the function data for depositFunds
      const data = executeEnergy.methods.depositFunds().encodeABI();

      const transaction = {
        from: sender,
        to: executeEnergy.options.address,
        value: amountInWei,
        gas: 200000,
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
      console.log("Error depositing funds:", error);
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

      // Fetch wallet balance
      const walletBalance = await web3.eth.getBalance(account);
      const totalBidCost = amount * price;

      // Convert wallet balance and total bid cost to Wei
      const walletBalanceWei =
        walletBalance.toString(); /* web3.utils.toWei(walletBalance.toString(), "ether") */
      const totalBidCostWei = web3.utils.toWei(
        totalBidCost.toString(),
        "ether"
      );
      // totalBidCost= BigInt(walletBalanceWei);
      console.log("str", totalBidCost.toString());
      console.log(walletBalanceWei, totalBidCostWei);
      // Verify the buyer's balance
      let proofValid = true;
      if (isProducer == 0) {
        proofValid = await buyersBalanceVerifier(
          walletBalanceWei,
          totalBidCostWei
        );
      } else {
        console.log("starting proof verification for seller using ZK");
        proofValid = await energyReserveVerifier(
          currentEnergy.toString(),
          amount.toString()
        );
      }
      // const proofValid = true;
      if (proofValid) {
        console.log("Proof verified successfully!");
        console.log(isProducer, isProducer.toString(), Boolean(isProducer));
        // Place the bid after successful verification
        const transaction = {
          from: account,
          to: closebid.options.address,
          data: closebid.methods
            .placeBid(
              amount,
              price,
              // web3.utils.toWei(price.toString(), "ether"),
              Boolean(isProducer) === true ? 1 : 0
            )
            .encodeABI(),
          gas: 200000,
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

        createTransaction(amount, price, isProducer ? "sell" : "buy");

        return result;
      } else {
        console.log(
          "Proof verification failed. Insufficient funds or invalid proof."
        );
        setError("Proof verification failed. You cannot place this bid.");
        return;
      }
    } catch (err) {
      console.log("Error placing bid:", err);
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
      console.log(err.message);
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
    const getEnergyColor = (level) => {
      if (level >= 75) return "bg-emerald-500";
      if (level >= 50) return "bg-yellow-500";
      if (level >= 25) return "bg-orange-500";
      return "bg-red-500";
    };
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
        {/* Contract Funds Box */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Contract Funds
              </h2>
              <div className="text-3xl font-bold text-emerald-600">
                {contractBalance} ETH
              </div>
            </div>
            <button
              onClick={(e) => {
                e.preventDefault();
                withdrawFunds();
              }}
              disabled={
                isWithdrawing || !contractBalance || contractBalance <= 0
              }
              className={`px-6 py-3 rounded-lg font-semibold text-white transition-colors
                ${
                  isWithdrawing || !contractBalance || contractBalance <= 0
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-emerald-600 hover:bg-emerald-700"
                }`}
            >
              {isWithdrawing ? (
                <span className="flex items-center">
                  <RefreshCcw className="w-4 h-4 mr-2 animate-spin" />
                  Withdrawing...
                </span>
              ) : (
                "Withdraw Funds"
              )}
            </button>
          </div>
        </div>
        {/* Energy Status Box */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              Current Energy Status
            </h2>
            {currentEnergy > 20 ? (
              <Battery
                className={`h-6 w-6 ${getEnergyColor(
                  currentEnergy
                )} bg-transparent`}
              />
            ) : (
              <BatteryCharging className="h-6 w-6 text-red-500 animate-pulse bg-transparent" />
            )}
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Current Level</span>
              <span className={`font-medium`}>
                {currentEnergy} <b>KWh</b>
              </span>
            </div>
            <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${getEnergyColor(
                  currentEnergy
                )}`}
                style={{ width: `${currentEnergy}%` }}
              />
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {currentEnergy <= 20
                ? "Low energy level! Consider charging soon."
                : currentEnergy >= 80
                ? "Energy level optimal"
                : "Energy level moderate"}
            </p>
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
  //#endregion

  //#region {DSO-FUNCTIONS}
  const buyFromDSO = async (energyAmount) => {
    if (!web3 || !account) {
      setError("Web3 or account not initialized. Please connect your wallet.");
      return;
    }

    try {
      // Ensure account is retrieved correctly
      const accounts = await web3.eth.getAccounts();
      const currentAccount = accounts[0]; // Use current account

      // Estimate gas for the transaction
      const gasEstimate = await executeEnergy.methods
        .buyEnergyFromDSO(energyAmount)
        .estimateGas({ from: currentAccount });
      console.log("Gas estimate:", gasEstimate);
      // Prepare the transaction
      const transaction = {
        from: currentAccount,
        to: executeEnergy.options.address,
        data: executeEnergy.methods.buyEnergyFromDSO(energyAmount).encodeABI(),
        gas: gasEstimate, // Use the estimated gas
        value: energyAmount + "", // Convert energyAmount to Wei if needed
      };

      // Send the transaction
      const result = await web3.eth.sendTransaction(transaction);
      console.log("Energy purchase successful:", result);

      return result;
    } catch (err) {
      console.log("Error buying energy:", err);
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
      console.log("Error Selling energy:", err);
      setError(err instanceof Error ? err.message : String(err));
    }
  };
  //#endregion
  
  const executeEnergyExchangeFromContract = async () => {
    try {
      // Log relevant contract state before execution
      console.log("DSO Address:", await executeEnergy.methods.DSO().call());
      console.log(
        "DSO Energy:",
        await executeEnergy.methods.getDSOEnergy().call()
      );
      console.log(
        "DSO ETH Balance:",
        await executeEnergy.methods.getDSOETHBalance().call()
      );

      // Optional: Check specific conditions that might prevent execution
      const dsoAddress = await executeEnergy.methods.DSO().call();
      const currentAccount = account; // Your sender account

      console.log("Current Account:", currentAccount);
      console.log("DSO Address:", dsoAddress);

      // Send the transaction
      const transaction = await executeEnergy.methods
        .executeEnergyExchange()
        .send({
          from: account,
          gas: await executeEnergy.methods
            .executeEnergyExchange()
            .estimateGas(),
        });

      console.log("Energy exchange executed successfully");
      console.log("Transaction Hash:", transaction.transactionHash);
      return transaction;
    } catch (error) {
      console.log("Full error details:", error);
      throw error;
    }
  };
  // Get past events
  /*   async function listenForEnergyExchange(callback) {
    console.log("Listening for EnergyExchanged event...");
    
    console.log(await executeEnergy.getPastEvents("EnergyExchanged"));
}
 */
  // listenForEnergyExchange((data) => {
  //     console.log("Event Detected:", data);
  // });
  // setInterval(() => {
  //   listenForEnergyExchange();
  // }, 5000);

  //#region {PAGE}

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <ArrowRightLeft className="h-6 w-6 text-emerald-400" />
              <h1 className="text-xl font-bold text-white">
                Energy Trading Platform
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <nav className="flex space-x-4">
                <button
                  onClick={() => setCurrentPage("trading")}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    currentPage === "trading"
                      ? "bg-gray-700 text-white"
                      : "text-gray-300 hover:text-white"
                  }`}
                >
                  Trading
                </button>
                <button
                  onClick={() => setCurrentPage("wallet")}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    currentPage === "wallet"
                      ? "bg-gray-700 text-white-900"
                      : "text-gray-300 hover:text-white-900"
                  }`}
                >
                  Wallet
                </button>
              </nav>
              <button
                onClick={connectWalletHandler}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                  account
                    ? "bg-emerald-900 text-emerald-200"
                    : "bg-emerald-600 text-white hover:bg-emerald-700"
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
                <div className="flex justify-center space-x-4 p-4 bg-gray-800 border-gray-700 rounded-lg shadow-sm">
                  <button
                    onClick={() => setTradingMode("p2p")}
                    className={`px-6 py-3 rounded-lg flex items-center space-x-2 ${
                      tradingMode === "p2p"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-gray-700 text-gray-600 hover:bg-gray-600"
                    }`}
                  >
                    <ArrowLeftRight className="h-5 w-5" />
                    <span>Peer-to-Peer Trading</span>
                  </button>
                  <button
                    onClick={() => setTradingMode("dso")}
                    className={`px-6 py-3 rounded-lg flex items-center space-x-2 ${
                      tradingMode === "dso"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
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
                  className={`flex flex-col items-center p-8 bg-gray rounded-xl shadow-lg transition-all ${
                    account
                      ? "hover:bg-gray-700 cursor-pointer"
                      : "opacity-50 cursor-not-allowed"
                  }`}
                >
                  <Battery className="h-16 w-16 text-emerald-600 mb-4" />
                  <h2 className="text-2xl font-bold text-white-900">
                    Buy Energy
                  </h2>
                  <p className="mt-2 text-gray-600">
                    Purchase energy from sellers
                  </p>
                  {!account && (
                    <p className="mt-2 text-sm text-red-400">
                      Connect wallet to continue
                    </p>
                  )}
                </button>

                <button
                  onClick={() => setRole("seller")}
                  disabled={!account}
                  className={`flex flex-col items-center p-8 bg-gray-800 rounded-xl shadow-lg transition-all ${
                    account
                      ? "hover:bg-gray cursor-pointer"
                      : "opacity-50 cursor-not-allowed"
                  }`}
                >
                  <BatteryCharging className="h-16 w-16 text-emerald-600 mb-4" />
                  <h2 className="text-2xl font-bold text-white-900">
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
                <div className="bg-gray-800 rounded-xl shadow-lg p-8">
                  <div className="text-center mb-6">
                    <Building2 className="h-16 w-16 text-emerald-600 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900">
                      Buy from DSO
                    </h2>
                    <p className="mt-2 text-gray-600">
                      Current DSO Rate: 8 ETH/kWh
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
                        className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 p-2 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 bg-white dark:bg-gray-900"
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

                <div className="bg-gray rounded-xl shadow-lg p-8">
                  <div className="text-center mb-6">
                    <Building2 className="h-16 w-16 text-teal-600 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900">
                      Sell to DSO
                    </h2>
                    <p className="mt-2 text-gray-600">
                      Current DSO Buy Rate: 2 ETH/kWh
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
                        className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 p-2 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 bg-white dark:bg-gray-900"
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

                <div className="bg-gray rounded-xl shadow-lg p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-400">
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
                      <label className="block text-sm font-medium text-gray-500">
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
                          <label className="block text-sm font-medium text-gray-500">
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
                          <label className="block text-sm font-medium text-gray-500">
                            Deposit Amount (ETH)
                          </label>
                          <input
                            type="number"
                            value={depositAmount}
                            onChange={(e) => setDepositAmount(e.target.value)}
                            className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 p-2 placeholder-gray-500 dark:placeholder-gray-300 bg-white dark:bg-gray-900 text-black dark:text-white"
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
                          <label className="block text-sm font-medium text-gray-500">
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
      {/* <button
        onClick={(e) => {
          e.preventDefault();
          withdrawFunds;
        }}
      >
        withdraw funds
      </button> */}
      {<footer>
      <button
        onClick={(e) => {
          e.preventDefault();
          executeEnergyExchangeFromContract();
        }}
        className="px-4 py-2 rounded-md bg-gray-300 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition"
      >
        EXECUTE ENERGY EXCHANGE
      </button>
      </footer>}
    </div>
  );

  //#endregion
}
