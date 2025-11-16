const express = require("express");
const User = require("../models/User");
const Manufacturer = require("../models/Manufacturer");
const Distributor = require("../models/Distributor");
const Pharmacist = require("../models/Pharmacist");
require("dotenv").config();

const { userRegistry } = require("../utils/blockchain"); 


const jwt = require("jsonwebtoken");
const verifySignature = require("../utils/verifySignature");
const {
  sendActivationEmail,
  verifyActivationToken,
} = require("../utils/email/accountActivation");

const JWT_SECRET = process.env.JWT_SECRET || "pharma-trace-secret";

const validateRoleData = (role, data) => {
  const errors = [];
  if (role === "distributor") {
    if (!data.companyName) errors.push("Company Name is required");
    if (!data.registrationNumber)
      errors.push("Registration Number is required");
    if (!data.warehouseAddress) errors.push("Warehouse Address is required");
  } else if (role === "pharmacist") {
    if (!data.pharmacyName) errors.push("Pharmacy Name is required");
    if (!data.licenseNumber) errors.push("License Number is required");
  }
  return errors;
};

const registerUser = async (req, res, next) => {
  try {
    console.log("=== Registration Request Start ===");
    console.log("Headers:", JSON.stringify(req.headers, null, 2));
    console.log("Body:", JSON.stringify(req.body, null, 2));
    console.log(
      "File:",
      req.file ? JSON.stringify(req.file, null, 2) : "No file uploaded"
    );
    console.log("=== Registration Request End ===");

    // Handle file upload errors
    if (req.fileValidationError) {
      console.error("File validation error:", req.fileValidationError);
      return res.status(400).json({ 
        success: false, 
        message: "File upload error", 
        error: req.fileValidationError 
      });
    }

    // License document comes from multer + Cloudinary
    const licenseDocument = req.file?.secure_url || req.file?.path || req.file?.filename || null;
    console.log("License Document URL:", licenseDocument);
    
    // Log cloudinary file details if available
    if (req.file) {
      console.log("Cloudinary upload details:", {
        secure_url: req.file.secure_url,
        public_id: req.file.public_id,
        format: req.file.format,
        bytes: req.file.bytes
      });
    }

    // Parse user data from body
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
      website,
      certifications,
      warehouseAddress,
      operationalRegions,
      pharmacyName,
      licenseNumber,
      pharmacyLocation,
    } = req.body;

    console.log("Request body:", JSON.stringify(req.body, null, 2));
    console.log("Uploaded file:", JSON.stringify(req.file, null, 2));

    // Validate signature
    if (!verifySignature(address, message, signature)) {
      return res.status(401).json({ message: "Invalid signature" });
    }

    // Validate required fields
    if (!address || !country) {
      return res
        .status(400)
        .json({ message: "Address and Country are required" });
    }
    if (
      !["consumer", "manufacturer", "distributor", "pharmacist"].includes(role)
    ) {
      return res.status(400).json({ message: "Invalid role" });
    }

    // Role-specific validation
    const roleErrors = validateRoleData(role, {
      companyName,
      registrationNumber,
      warehouseAddress,
      pharmacyName,
      licenseNumber,
      licenseDocument,
    });
    if (roleErrors.length > 0) {
      return res.status(400).json({ message: roleErrors.join(" ") });
    }

    // Normalize address and check existing user
    const normalizedAddress = address.toLowerCase();
    const existing = await User.findOne({
      address: { $regex: new RegExp(`^${address}$`, "i") },
    });
    if (existing) {
      return res.status(400).json({
        message: `User already registered with this wallet address as ${existing.role}`,
        existingRole: existing.role,
        existingName: existing.name,
        attemptedRole: role,
      });
    }

    // Create User
    const newUser = await User.create({
      name,
      role,
      address: normalizedAddress,
      email,
      phone,
      country,
      state,
      city,
    });

    // Create role-specific document
    try {
      if (role === "manufacturer") {
        await Manufacturer.create({
          user: newUser._id,
          companyName,
          registrationNumber,
          licenseDocument,
          certifications: certifications || [],
        });
      } else if (role === "distributor") {
        await Distributor.create({
          user: newUser._id,
          companyName,
          registrationNumber,
          licenseDocument,
          warehouseAddress,
          operationalRegions: operationalRegions || [],
        });
      } else if (role === "pharmacist") {
        await Pharmacist.create({
          user: newUser._id,
          pharmacyName,
          licenseNumber,
          licenseDocument,
          pharmacyLocation,
        });
      }
    } catch (roleError) {
      // Rollback User if role creation fails
      await User.findByIdAndDelete(newUser._id);
      return res.status(500).json({
        message: `Failed to create ${role} profile`,
        error: roleError.message,
      });
    }

    // Send activation email (optional warning if fails)
    const emailResult = await sendActivationEmail({
      userId: newUser._id,
      address: newUser.address,
      role: newUser.role,
      name: newUser.name,
      email: newUser.email,
    });
    if (!emailResult.success)
      console.warn("Activation email failed:", emailResult.error);

    const RoleEnum = { 
      None: 0, 
      Superadmin: 1, 
      Manufacturer: 2, 
      Distributor: 3, 
      Pharmacist: 4, 
      Consumer: 5 
    };
    
    // Map user role to RoleEnum
    const getRoleEnumValue = (role) => {
      const roleMap = {
        'consumer': RoleEnum.Consumer,
        'pharmacist': RoleEnum.Pharmacist,
        'distributor': RoleEnum.Distributor,
        'manufacturer': RoleEnum.Manufacturer,
        'superadmin': RoleEnum.Superadmin
      };
      return roleMap[role] || RoleEnum.None;
    };
    
    const userRoleEnum = getRoleEnumValue(newUser.role);
    
    const tx = await userRegistry.setUser(
              newUser.address,
              newUser.isApproved,
              userRoleEnum
            );
            await tx.wait();
            console.log(`User ${newUser.address} role set to ${newUser.role} (${userRoleEnum})`);

    newUser.txHash = tx.hash;
    await newUser.save();

    // Return success
    return res.status(201).json({
      message: "User registered successfully",
      data: { name, role, address, email, phone, country, licenseDocument },
    });
  } catch (error) {
    console.error("Registration failed:", {
      message: error.message,
      name: error.name,
      stack: error.stack,
    });

    // Pass structured error to global error handler
    error.status = error.status || 500;
    if (!error.message) {
      error.message = "Registration failed";
    }

    next(error);
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

  if (!verifySignature(address, message, signature)) {
    return res.status(401).json({ message: "Invalid signature" });
  }

  try {
    // Case-insensitive address lookup (escape special regex characters)
    const user = await User.findOne({
      address: {
        $regex: new RegExp(
          `^${address.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
          "i"
        ),
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check activation status
    if (!user.isActive) {
      return res.status(403).json({
        message:
          "Account not activated. Please check your email for the activation link.",
      });
    }

    // Check approval status
    if (!user.isApproved) {
      return res.status(403).json({
        message: "Account not approved. Please contact support for assistance.",
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign(
      {
        address: user.address,
        name: user.name,
        role: user.role,
        userId: user._id,
      },
      process.env.JWT_SECRET,
      { expiresIn: "30d" } // token expires in 30 days
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
    return res
      .status(500)
      .json({ message: "Login failed", error: error.message });
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
    const address = req.params.address; // Don't convert to lowercase here
    console.log("Looking for address:", address);

    // Use case-insensitive regex search like in other functions
    const user = await User.findOne({
      address: {
        $regex: new RegExp(
          `^${address.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
          "i"
        ),
      },
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ data: user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching user" });
  }
};

const checkSuperAdmin = async (req, res) => {
  try {
    const { address } = req.body;
    
    // Validate that address is provided
    if (!address) {
      return res.status(400).json({ 
        message: "Wallet address is required",
        isSuperAdmin: false 
      });
    }

    // Normalize address to lowercase for consistent comparison
    const normalizedAddress = address.toLowerCase();
    console.log("Checking superadmin status for address:", normalizedAddress);

    // Find user with case-insensitive address lookup
    const user = await User.findOne({
      address: {
        $regex: new RegExp(
          `^${normalizedAddress.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
          "i"
        ),
      },
    });

    if (!user) {
      return res.status(404).json({ 
        message: "User not found",
        isSuperAdmin: false,
        address: normalizedAddress
      });
    }

    // Check if user is superadmin and account is active/approved
    const isSuperAdmin = user.role === 'superadmin' && user.isActive && user.isApproved;

    return res.status(200).json({
      message: isSuperAdmin ? "User is a superadmin" : "User is not a superadmin",
      isSuperAdmin,
      address: user.address,
      role: user.role,
      isActive: user.isActive,
      isApproved: user.isApproved,
      name: user.name
    });

  } catch (error) {
    console.error("Error checking superadmin status:", error);
    return res.status(500).json({ 
      message: "Internal server error",
      error: error.message,
      isSuperAdmin: false 
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserByAddress,
  activateUser,
  checkSuperAdmin,
};
