const mongoose = require('mongoose');
const Product = require('../models/Product');
const Batch = require('../models/Batch');
const Manufacturer = require('../models/Manufacturer');

const getManufacturerProfile = async (req, res) => {
  try {

    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    console.log("userId:", req.user.userId);

    const manufacturer = await Manufacturer.findOne({ user: req.user.userId })
      .select('-password')
      .lean();

    if (!manufacturer) {
      return res.status(404).json({ message: "Manufacturer not found" });
    }

    // Get additional statistics
    const totalProducts = await Product.countDocuments({ manufacturerId: manufacturer._id });
    const totalBatches = await Batch.countDocuments({ manufacturerId: manufacturer._id });
    const totalInTransit = await Batch.countDocuments({
      manufacturerId: manufacturer._id,
      shipmentStatus: { $regex: '^In.*Transit$', $options: 'i' }
    });

    const manufacturerDetails = {
      ...manufacturer,
      statistics: {
        totalProducts,
        totalBatches,
        totalInTransit
      }
    };

    res.status(200).json(manufacturerDetails);
  } catch (error) {
    console.error('Error fetching manufacturer profile:', error);
    res.status(500).json({ message: 'Failed to fetch manufacturer profile' });
  }
};

const getManufacturerDashboard = async (req, res) => {
  try {
    // Check authentication
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Convert userId to ObjectId
    let manufacturerId;
    try {
      manufacturerId = new mongoose.Types.ObjectId(req.user.userId);
    } catch (error) {
      console.error('Invalid manufacturerId format:', req.user.userId);
      return res.status(400).json({ message: 'Invalid manufacturer ID format' });
    }

    // Count total products for the manufacturer
    const totalProducts = await Product.countDocuments({ manufacturerId });
    console.log("Total products:", totalProducts);

    // Count total batches for the manufacturer
    const totalBatches = await Batch.countDocuments({ manufacturerId });
    console.log("Total batches:", totalBatches);

    // Count batches with shipmentStatus "In Transit"
    const totalInTransit = await Batch.countDocuments({
      manufacturerId,
      shipmentStatus: { $regex: '^In.*Transit$', $options: 'i' }
    });
    console.log("Total in-transit batches:", totalInTransit);

    // Count batches delivered successfully
    const totalDelivered = await Batch.countDocuments({
      manufacturerId,
      shipmentStatus: 'Delivered'
    });
    console.log("Total delivered batches:", totalDelivered);

    // Count verified products 
    const verifiedProducts = await Product.countDocuments({
      manufacturerId,
      verificationStatus: 'Verified'
    });
    console.log("Verified products:", verifiedProducts);

    // Count batches expiring in next 30 days
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    const expiringBatches = await Batch.countDocuments({
      manufacturerId,
      expiryDate: { $lte: thirtyDaysFromNow, $gte: new Date() },
      shipmentStatus: { $nin: ['Delivered', 'Recalled'] }
    });
    console.log("Expiring batches:", expiringBatches);

    // Debug: Check batches for the manufacturer
    const batchesCheck = await Batch.find({ manufacturerId }).lean();
    console.log("Batches found:", batchesCheck.length, batchesCheck.map(b => ({
      batchNumber: b.batchNumber,
      shipmentStatus: b.shipmentStatus
    })));

    // Fetch 5 most recent products, one per batchNumber
    const recentProducts = await Product.aggregate([
      {
        $match: { manufacturerId }
      },
      {
        $sort: { registrationTimestamp: -1 }
      },
      {
        $group: {
          _id: "$batchNumber",
          product: { $first: "$$ROOT" }
        }
      },
      {
        $replaceRoot: { newRoot: "$product" }
      },
      {
        $limit: 5
      },
      {
        $project: {
          productName: 1,
          serialNumber: 1,
          batchNumber: 1
        }
      }
    ]).exec();

    // Fetch manufactureDate and status for each product from Batch
    for (let product of recentProducts) {
      const batch = await Batch.findOne({ batchNumber: product.batchNumber })
        .select('manufactureDate shipmentStatus')
        .lean();
      console.log(`Processing product with batchNumber: ${product.batchNumber}, batch found:`, !!batch, batch ? { shipmentStatus: batch.shipmentStatus } : {});
      product.manufactureDate = batch ? new Date(batch.manufactureDate).toISOString().split('T')[0] : null;
      product.name = product.productName; // Rename productName to name
      delete product.productName; // Remove productName
      // Normalize status to use hyphens
      product.status = batch && batch.shipmentStatus 
        ? batch.shipmentStatus.toLowerCase().replace(/\s+/g, '-') 
        : 'unknown';
    }
    console.log("Recent products:", recentProducts);

    // Fetch recent batches with complete information
    const recentBatches = await Batch.aggregate([
      {
        $match: { manufacturerId }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $limit: 5
      },
      {
        $lookup: {
          from: 'products',
          localField: 'batchNumber',
          foreignField: 'batchNumber',
          as: 'products'
        }
      },
      {
        $project: {
          _id: 1,
          batchNumber: 1,
          shipmentStatus: 1,
          dosageForm: 1,
          strength: 1,
          quantityProduced: 1,
          quantityAvailable: { 
            $subtract: ['$quantityProduced', { $size: '$products' }] 
          },
          productsCount: { $size: '$products' }
        }
      }
    ]).exec();

    console.log("Recent batches:", recentBatches);

    res.status(200).json({
      totalProducts,
      totalBatches,
      totalInTransit,
      totalDelivered,
      verifiedProducts,
      expiringBatches,
      recentProducts,
      recentBatches,
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return res.status(500).json({
      message: 'Failed to fetch dashboard data',
      details: error.message,
    });
  }
};

module.exports = { getManufacturerDashboard, getManufacturerProfile };