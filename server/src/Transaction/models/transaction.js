import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
  accountNumber: {
    type: String, // No need for ObjectId, since we're using account numbers
    required: true,
    // ref: "User" // Linking to User model via account number
  },
  energyAmount: {
    type: Number,
    required: true
  },
  pricePerUnit: {
    type: Number,
    required: true
  },
  totalPrice: {
    type: Number,
    required: true
  },
  transactionType: {
    type: String,
    enum: ["buy", "sell"],
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const Transaction = mongoose.model("Transaction", transactionSchema);
export default Transaction;
