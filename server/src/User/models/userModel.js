import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  accountNumber: {
    type: String,
    unique: true,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    unique: true,
    required: true
  }
});

const User = mongoose.model("User", userSchema);
export default User;
