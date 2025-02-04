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

export const getUserByAccountNumber = async (req, res) => {
  try {
    const { accountNumber } = req.params; // Extract accountNumber from request parameters

    // Find user by accountNumber
    const user = await User.findOne({ accountNumber });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
export const updateUserEnergy = async (req, res) => {
  try {
    const { accountNumber } = req.params; // Extract accountNumber from request parameters
    const { energy } = req.body; // Extract new energy value from request body

    // Validate energy value
    if (typeof energy !== "number" || energy < 0) {
      return res.status(400).json({ message: "Energy must be a positive number" });
    }

    // Find and update the user
    const user = await User.findOneAndUpdate(
      { accountNumber },
      { energy }, // Set the new energy value
      { new: true, runValidators: true } // Return updated document & apply schema validation
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "Energy updated successfully", user });
  } catch (error) {
    console.error("Error updating energy:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
