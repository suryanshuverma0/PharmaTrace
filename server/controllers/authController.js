const express = require("express");
const User = require("../models/User");
const Manufacturer = require("../models/Manufacturer");
const Distributor = require("../models/Distributor");

const jwt = require("jsonwebtoken");
const verifySignature = require("../utils/verifySignature");
const {
  sendActivationEmail,
  verifyActivationToken,
} = require("../utils/email/accountActivation");

const JWT_SECRET = process.env.JWT_SECRET || "pharma-tracking-secret";

const registerUser = async (req, res) => {
  const { name, role, phone, email, address, message, signature } = req.body;

  if (!verifySignature(address, message, signature)) {
    return res.status(401).json({ message: "Invalid signature" });
  }

  try {
    const existing = await User.findOne({ address });
    if (existing)
      return res.status(400).json({ message: "User already registered" });

    const newUser = new User({ name, role, address, email, phone });
    await newUser.save();

    // Create role-specific entry
    if (role === "manufacturer") {
      await Manufacturer.create({ user: newUser._id });
    } else if (role === "distributor") {
      await Distributor.create({ user: newUser._id });
    }

    const userDetails = {
      userId: newUser._id,
      address: newUser.address,
      role: newUser.role,
      name: newUser.name,
      email: newUser.email,
    };

    const mailResponse = sendActivationEmail(userDetails);
    if (!mailResponse.success) {

      // return res.status(500).json({
      //   message: "Failed to send activation email",
      //   error: mailResponse.error,
      // });

    }

    return res.status(201).json({ data: { name, role, address } });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Registration failed", error: err.message });
  }
};

const loginUser = async (req, res) => {
  const { address, message, signature } = req.body;

  if (!address || !message || !signature) {
    return res.status(400).json({
      message: "Missing required fields",
      received: {
        address: !!address,
        message: !!message,
        signature: !!signature,
      },
    });
  }

  const isValidSignature = verifySignature(address, message, signature);
  if (!isValidSignature) {
    return res.status(401).json({ message: "Invalid signature" });
  }

  try {
    const user1 = await User.findOne({ address: address });
    const user2 = await User.findOne({ address: address.toLowerCase() });
    const user3 = await User.findOne({ address: address.toUpperCase() });
    const user4 = await User.findOne({
      address: { $regex: new RegExp(`^${address}$`, "i") },
    });

    const user = user1 || user2 || user3 || user4;

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const token = jwt.sign(
      { address: user.address, role: user.role, userId: user._id },
      JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.status(200).json({
      data: {
        token,
        role: user.role,
        name: user.name,
        address: user.address,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Login failed", error: error.message });
  }
};

const activateUser = async (req, res) => {
  const { token } = req.params;

  try {
    const tokenVerificationResponse = verifyActivationToken(token);
    if (!tokenVerificationResponse.success) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }
    const { userId } = tokenVerificationResponse.data;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.isActive = true;
    await user.save();
    return res.status(200).json({ message: "User activated successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching user" });
  }
};


const getUserByAddress = async (req, res) => {
  try {
    const user = await User.findOne({ address: req.params.address });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ data: user });
  } catch {
    res.status(500).json({ message: "Error fetching user" });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserByAddress,
  activateUser,
};
