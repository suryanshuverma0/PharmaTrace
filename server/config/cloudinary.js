const dotenv = require('dotenv');
const path = require('path');

// Ensure we load the correct .env file
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const cloudinary = require('cloudinary').v2;

// Validate environment variables
const requiredVars = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required Cloudinary environment variables:', missingVars);
  throw new Error(`Missing Cloudinary environment variables: ${missingVars.join(', ')}`);
}

console.log("✅ Cloudinary Config Loaded:", {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET ? '***' : 'not set',
});

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Test the configuration
const testConfig = cloudinary.config();
console.log("🔧 Cloudinary Instance Config:", {
  cloud_name: testConfig.cloud_name,
  api_key: testConfig.api_key ? '***' : 'not set'
});

module.exports = cloudinary;
