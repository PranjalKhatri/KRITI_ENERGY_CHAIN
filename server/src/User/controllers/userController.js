import User from "../models/userModel.js";

// Create a new user
export const createUser = async (req, res) => {
  console.log("Received Data:", req.body);
  try {
    const { accountNumber, name, email } = req.body;
    // console.log("Received Data:", accountNumber, name, email);
    // Check if user already exists
    let user = await User.findOne({ accountNumber });
    if (user) {
      console.log("User already exists");
      return res.status(400).json({ message: "User already exists" });
    }

    // Create and save user
    user = new User({ accountNumber, name, email });
    await user.save();
    res.status(201).json({ message: "User created successfully", user });
    console.log("User created successfully");
  } catch (error) {
    console.error("Erro in creating");
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Get all users
export const getUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
