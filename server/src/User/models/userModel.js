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
  },
  energy:{
    type:Number,
    default:100,
    min:0,
    max:10000
  }
});

const User = mongoose.model("User", userSchema);
export default User;
