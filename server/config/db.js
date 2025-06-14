const mongoose = require('mongoose');

require('dotenv').config();
const DB_URI = process.env.MONGODB_URI;

if (!DB_URI) {
  throw new Error('MongoDB URI is not defined in the environment variables');
}

const connect_db = async () => {
  try {
    await mongoose.connect(DB_URI)
    console.log('MongoDB connected successfully');
  } catch (error) {
    process.exit(1);
  }
}

module.exports = connect_db;
