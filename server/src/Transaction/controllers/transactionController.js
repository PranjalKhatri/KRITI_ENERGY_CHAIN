import Transaction from '../models/transaction.js';
import User from '../../User/models/userModel.js';
// Create a new transaction
export const createTransaction = async (req, res) => {
  try {
    const { accountNumber, energyAmount, pricePerUnit, transactionType } = req.body;

    // Validate that the user exists
    const user = await User.findOne({ accountNumber });
    if (!user) {
      return res.status(404).json({ message: "User not found. Please register first." });
    }

    // Calculate total price
    const totalPrice = energyAmount * pricePerUnit;

    // Create and save transaction
    const transaction = new Transaction({
      accountNumber,
      energyAmount,
      pricePerUnit,
      totalPrice,
      transactionType
    });

    await transaction.save();
    res.status(201).json({ message: "Transaction saved successfully", transaction });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
// Get all transactions
export const getAllTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find();

    // Manually fetch user data based on accountNumber
    const transactionsWithUser = await Promise.all(
      transactions.map(async (txn) => {
        const user = await User.findOne({ accountNumber: txn.accountNumber }).select("name email");
        return {
          ...txn._doc, // Spread transaction data
          user: user || null, // Attach user data (or null if not found)
        };
      })
    );

    res.status(200).json(transactionsWithUser);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};


export const getTransactionsByUser = async (req, res) => {
  try {
    const { accountNumber } = req.params; // ✅ Extract from URL params

    if (!accountNumber) {
      return res.status(400).json({ message: "Account number is required" });
    }

    // ✅ Fetch transactions by account number
    const transactions = await Transaction.find({ accountNumber });

    if (!transactions.length) {
      return res.status(404).json({ message: "No transactions found for this user" });
    }

    res.status(200).json(transactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};



// Delete a transaction
export const deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const transaction = await Transaction.findByIdAndDelete(id);
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    res.status(200).json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
