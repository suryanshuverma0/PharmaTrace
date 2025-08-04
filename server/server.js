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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});