const dotenv = require('dotenv');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const batchRoutes = require("./routes/batchRoutes");
const manufacturerRoutes = require("./routes/manufacturerRoutes");
const distributerRoutes = require('./routes/distributerRoutes');

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
app.use("/api/pharmacies", require("./routes/pharmacyRoutes"));
app.use("/api/tracking", require("./routes/trackingRoutes"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});