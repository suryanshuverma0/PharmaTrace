const dotenv = require("dotenv");
const path = require("path");

// Load environment variables first
dotenv.config({ path: path.join(__dirname, '.env') });

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const batchRoutes = require("./routes/batchRoutes");
const manufacturerRoutes = require("./routes/manufacturerRoutes");
const distributerRoutes = require("./routes/distributerRoutes");
const assignmentRoutes = require("./routes/assignmentRoutes");
const verificationRoutes = require("./routes/verificationRoutes");

const connect_db = require("./config/db");
connect_db();

const app = express();
app.use(cors());
app.use(express.json());

// routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/batches", batchRoutes);
app.use("/api/manufacturer", manufacturerRoutes);
app.use("/api/distributer", distributerRoutes);
app.use("/api/pharmacy", require("./routes/pharmacyRoutes"));
app.use("/api/tracking", require("./routes/trackingRoutes"));
app.use("/api/assignments", assignmentRoutes);
app.use("/api/distribution", require("./routes/distributionRoutes"));
app.use("/api/verification", verificationRoutes);
app.use("/api/blockchain", require("./routes/blockchainVerificationRoutes"));
app.use("/api/nepal", require("./routes/districtsRoutes"));


// Admin routes
app.use(
  "/api/admin/manufacturers",
  require("./admin/routes/manufacturerRoute")
);
app.use("/api/admin/distributors", require("./admin/routes/distributorRoute"));
app.use("/api/admin/pharmacists", require("./admin/routes/pharmacistRoute"));

// Admin analytics routes
app.use("/api/admin", require("./routes/adminAnalyticsRoutes"));

// Test route
app.get("/api/test", (req, res) => {
  res.json({ message: "Server is working!", timestamp: new Date() });
});

// Check tracking records
app.get("/api/tracking/check", async (req, res) => {
  try {
    const ProductTracking = require("./models/ProductTracking");
    const latestTracking = await ProductTracking.find()
      .sort({ scannedAt: -1 })
      .limit(5);
    res.json({
      success: true,
      count: latestTracking.length,
      records: latestTracking,
    });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// Ensure uploads directory exists
const fs = require("fs");
const uploadsDir = path.join(__dirname, "public", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Global error handler:", {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Handle specific error types
  if (err.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors: Object.values(err.errors).map((e) => e.message),
    });
  }

  if (err.name === "MongoError" || err.name === "MongoServerError") {
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Duplicate entry found",
        field: Object.keys(err.keyPattern)[0],
      });
    }
  }

  // Default error response
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});


// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: Object.values(err.errors).map(e => e.message)
    });
  }

  if (err.name === 'MongoError' || err.name === 'MongoServerError') {
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Duplicate entry found',
        field: Object.keys(err.keyPattern)[0]
      });
    }
  }

  // Default error response
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 3000;

// Initialize auto product generation service
const { initProductAutoGeneration } = require('./services/productAutoGeneration');

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  // Start auto product generation service
  initProductAutoGeneration();
});
