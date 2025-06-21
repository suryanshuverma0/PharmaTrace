const express = require("express");
const User = require("../models/User");
const Manufacturer = require("../models/Manufacturer");
const Distributor = require("../models/Distributor");
require('dotenv').config();


const jwt = require("jsonwebtoken");
const verifySignature = require("../utils/verifySignature");
const {
  sendActivationEmail,
  verifyActivationToken,
} = require("../utils/email/accountActivation");

const JWT_SECRET = process.env.JWT_SECRET || "pharma-trace-secret";

const validateRoleData = (role, data) => {
  const errors = [];
  if (role === 'distributor') {
    if (!data.companyName) errors.push('Company Name is required');
    if (!data.registrationNumber) errors.push('Registration Number is required');
    if (!data.warehouseAddress) errors.push('Warehouse Address is required');
  } else if (role === 'pharmacist') {
    if (!data.pharmacyName) errors.push('Pharmacy Name is required');
    if (!data.licenseNumber) errors.push('License Number is required');
  }
  return errors;
};

const registerUser = async (req, res) => {
  const {
    name,
    role,
    phone,
    email,
    address,
    country,
    state,
    city,
    message,
    signature,
    companyName,
    registrationNumber,
    licenseDocument,
    website,
    certifications,
    warehouseAddress,
    operationalRegions,
    pharmacyName,
    licenseNumber,
    pharmacyLocation,
  } = req.body;

  // Validate signature
  if (!verifySignature(address, message, signature)) {
    return res.status(401).json({ message: 'Invalid signature' });
  }

  // Validate required User fields
  if (!address || !country) {
    return res.status(400).json({ message: 'Address and Country are required' });
  }
  if (!['consumer', 'manufacturer', 'distributor', 'pharmacist'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }

  // Validate role-specific fields
  const roleValidationErrors = validateRoleData(role, {
    companyName,
    registrationNumber,
    warehouseAddress,
    pharmacyName,
    licenseNumber,
  });
  if (roleValidationErrors.length > 0) {
    return res.status(400).json({ message: roleValidationErrors.join(' ') });
  }

  try {
    // Check for existing user
    const existing = await User.findOne({ address });
    if (existing) {
      return res.status(400).json({ message: 'User already registered' });
    }

    // Create User
    const newUser = new User({
      name,
      role,
      address,
      email,
      phone,
      country,
      state,
      city,
    });
    await newUser.save();

    // Create role-specific entry
    if (role === 'manufacturer') {
      await Manufacturer.create({
        user: newUser._id,
        companyName,
        registrationNumber,
        licenseDocument,
        certifications: certifications || [],
      });
    } else if (role === 'distributor') {
      await Distributor.create({
        user: newUser._id,
        companyName,
        registrationNumber,
        licenseDocument,
        warehouseAddress,
        operationalRegions: operationalRegions || [],
      });
    } else if (role === 'pharmacist') {
      await Pharmacist.create({
        user: newUser._id,
        pharmacyName,
        licenseNumber,
        licenseDocument,
        pharmacyLocation,
      });
    }

    const userDetails = {
      userId: newUser._id,
      address: newUser.address,
      role: newUser.role,
      name: newUser.name,
      email: newUser.email,
    };

    const mailResponse = await sendActivationEmail(userDetails);
    if (!mailResponse.success) {
      console.warn('Failed to send activation email:', mailResponse.error);
    }

    return res.status(201).json({
      message: 'User registered successfully',
      data: { name, role, address, email, phone, country },
    });
  } catch (err) {
    return res.status(500).json({ message: 'Registration failed', error: err.message });
  }
};

const loginUser = async (req, res) => {
  const { address, message, signature } = req.body;

  if (!address || !message || !signature) {
    return res.status(400).json({
      message: 'Missing required fields',
      received: {
        address: !!address,
        message: !!message,
        signature: !!signature,
      },
    });
  }

  if (!verifySignature(address, message, signature)) {
    return res.status(401).json({ message: 'Invalid signature' });
  }

  try {
    // Case-insensitive address lookup
    const user = await User.findOne({ address: { $regex: new RegExp(`^${address}$`, 'i') } });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check activation status
    if (!user.isActive) {
      return res.status(403).json({
        message: 'Account not activated. Please check your email for the activation link.',
      });
    }

    // Check approval status
    if (!user.isApproved) {
      return res.status(403).json({
        message: 'Account not approved. Please contact support for assistance.',
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();


    const token = jwt.sign(
      { address: user.address, name:user.name, role: user.role, userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    return res.status(200).json({
      data: {
        token,
        address: user.address,
        userId: user._id,
        role: user.role,
        name: user.name,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Login failed', error: error.message });
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
