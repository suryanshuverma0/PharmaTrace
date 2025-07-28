const Batch = require("../models/Batch");
const Product = require("../models/Product");

// Track a product by serial number
const trackProduct = async (req, res) => {
  try {
    const { serialNumber } = req.params;
    const manufacturerId = req.user.userId; // Get logged-in manufacturer's ID

    // Find the product by serial number
    const product = await Product.findOne({ serialNumber })
      .populate('batchId')
      .populate({
        path: 'manufacturerId',
        select: 'companyName address licenseNumber email phoneNumber'
      });

    if (!product) {
      return res.status(404).json({
        message: 'Product not found'
      });
    }

    // Verify that the product belongs to the requesting manufacturer
    if (product.manufacturerId._id.toString() !== manufacturerId) {
      return res.status(403).json({
        message: 'You are not authorized to track this product'
      });
    }

    // Get the batch information
    const batch = await Batch.findById(product.batchId);

    // Format product data with all necessary information
    const productData = {
      productName: product.productName,
      serialNumber: product.serialNumber,
      batchNumber: batch.batchNumber,
      manufactureDate: batch.manufactureDate,
      expiryDate: batch.expiryDate,
      status: product.status || 'manufactured',
      manufacturer: product.manufacturerId.companyName,
      productionLocation: product.manufacturerId.address,
      manufacturerDetails: {
        licenseNumber: product.manufacturerId.licenseNumber,
        email: product.manufacturerId.email,
        phone: product.manufacturerId.phoneNumber
      },
      storageTemp: product.storageCondition || '2°C to 8°C',
      humidity: '45% to 65%',
      // Add shipping details if available
      ...(product.shipping && {
        shipmentDate: product.shipping.date,
        shipmentOrigin: product.shipping.origin,
        carrier: product.shipping.carrier,
        trackingId: product.shipping.trackingId
      }),
      // Add quality check details if available
      ...(product.qualityCheck && {
        qualityCheckDate: product.qualityCheck.date,
        qualityCheckBy: product.qualityCheck.verifiedBy,
        qualityNotes: product.qualityCheck.notes
      }),
      lastVerifiedBy: product.lastVerifiedBy,
      currentLocation: product.currentLocation || product.manufacturerId.address,
      fingerprint: product.fingerprint
    };

    res.json(productData);
  } catch (error) {
    console.error('Error tracking product:', error);
    res.status(500).json({
      message: 'Failed to track product',
      error: error.message
    });
  }
};

module.exports = {
  trackProduct
};
