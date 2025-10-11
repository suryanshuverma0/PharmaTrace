const dotenv = require('dotenv');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const batchRoutes = require("./routes/batchRoutes");
const manufacturerRoutes = require("./routes/manufacturerRoutes");
const distributerRoutes = require('./routes/distributerRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const verificationRoutes = require('./routes/verificationRoutes');

const connect_db = require('./config/db');

dotenv.config();
connect_db();

const app = express();
app.use(cors());
app.use(express.json());

// routes
app.use('/api/auth', authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/batches", batchRoutes);
app.use("/api/manufacturer", manufacturerRoutes);
app.use("/api/distributer", distributerRoutes);
app.use("/api/pharmacy", require("./routes/pharmacyRoutes"));
app.use("/api/tracking", require("./routes/trackingRoutes"));
app.use("/api/assignments", assignmentRoutes);
app.use("/api/distribution", require("./routes/distributionRoutes"));
app.use("/api/verification", verificationRoutes);

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is working!', timestamp: new Date() });
});

// Check tracking records
app.get('/api/tracking/check', async (req, res) => {
  try {
    const ProductTracking = require('./models/ProductTracking');
    const latestTracking = await ProductTracking.find().sort({ scannedAt: -1 }).limit(5);
    res.json({ success: true, count: latestTracking.length, records: latestTracking });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('🔥 SERVER WITH DEBUG LOGS STARTED!');
});