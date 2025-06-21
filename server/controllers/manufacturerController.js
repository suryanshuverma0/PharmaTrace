const Product = require('../models/Product');
const Batch = require('../models/Batch');

const getManufacturerDashboard = async (req, res) => {
  try {
    // Count total products for the manufacturer
    const totalProducts = await Product.countDocuments({ manufacturerId: req.user.userId });

    // Fetch 5 most recent products
    const recentProducts = await Product.find({ manufacturerId: req.user.userId })
      .sort({ registrationTimestamp: -1 })
      .limit(5)
      .select('productName serialNumber batchNumber status')
      .lean();

    // Fetch manufactureDate for each product from Batch
    for (let product of recentProducts) {
      const batch = await Batch.findOne({ batchNumber: product.batchNumber })
        .select('manufactureDate')
        .lean();
      product.manufactureDate = batch ? new Date(batch.manufactureDate).toISOString().split('T')[0] : null;
      product.name = product.productName; // Rename productName to name
      delete product.productName; // Remove productName
      // Ensure status has a default if undefined
      product.status = product.status || 'manufactured';
    }

    res.status(200).json({
      totalProducts,
      recentProducts,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to fetch dashboard data',
      details: error.message,
    });
  }
};

module.exports = { getManufacturerDashboard };
