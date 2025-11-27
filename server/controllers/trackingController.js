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

    // Get the batch information with populated shipment history
    const batch = await Batch.findById(product.batchId)
      .populate('shipmentHistory.verifiedBy.user', 'companyName address licenseNumber');

    if (!batch) {
      return res.status(404).json({
        message: 'Batch information not found'
      });
    }

    // Get current location from latest shipment history
    const currentLocation = batch.shipmentHistory.length > 0 
      ? batch.shipmentHistory[batch.shipmentHistory.length - 1].to 
      : product.manufacturerId.address;

    // Format shipment history for journey tracking
    const journey = [];

    // Add manufacturing step (always first)
    journey.push({
      step: "Manufactured",
      location: batch.productionLocation || product.manufacturerId.address,
      date: batch.manufactureDate,
      verifiedBy: product.manufacturerId.companyName,
      role: "Manufacturer",
      temperature: batch.storageConditions || product.storageCondition || "2°C to 8°C",
      humidity: "45% to 65%",
      status: "Completed",
      batchNumber: batch.batchNumber,
      quantityProduced: batch.quantityProduced
    });

    // Add shipment history from batch
    if (batch.shipmentHistory && batch.shipmentHistory.length > 0) {
      batch.shipmentHistory.forEach((shipment, index) => {
        journey.push({
          step: getShipmentStepName(shipment.status, index),
          location: shipment.to,
          date: shipment.timestamp,
          verifiedBy: shipment.actor?.name || shipment.verifiedBy?.user?.companyName || 'System',
          role: shipment.actor?.type || shipment.verifiedBy?.role || 'Logistics',
          fromLocation: shipment.from,
          quantity: shipment.quantity,
          status: shipment.status,
          txHash: shipment.txHash,
          carrier: shipment.actor?.name,
          trackingId: shipment.txHash ? shipment.txHash.substring(0, 12) + '...' : undefined,
          // Environmental conditions
          ...(shipment.environmentalConditions && {
            temperature: shipment.environmentalConditions.temperature,
            humidity: shipment.environmentalConditions.humidity,
            environmentalStatus: shipment.environmentalConditions.status
          }),
          // Quality check info
          ...(shipment.qualityCheck && {
            qualityCheckBy: shipment.qualityCheck.performedBy,
            qualityResult: shipment.qualityCheck.result,
            qualityNotes: shipment.qualityCheck.notes,
            qualityDate: shipment.qualityCheck.date
          }),
          remarks: shipment.remarks
        });
      });
    }

    // Add current status
    const currentStatus = batch.shipmentStatus || 'Produced';
    if (currentStatus !== 'Produced') {
      journey.push({
        step: "Current Status",
        location: currentLocation,
        date: new Date(),
        verifiedBy: "System",
        role: "Status Update",
        status: currentStatus,
        isCurrentStatus: true
      });
    }

    // Format product data with all necessary information
    const productData = {
      name: product.productName,
      productName: product.productName,
      serialNumber: product.serialNumber,
      batchNumber: batch.batchNumber,
      manufactureDate: batch.manufactureDate,
      expiryDate: batch.expiryDate,
      status: currentStatus.toLowerCase().replace(' ', '-'),
      manufacturer: product.manufacturerId.companyName,
      productionLocation: batch.productionLocation || product.manufacturerId.address,
      currentLocation: currentLocation,
      manufacturerDetails: {
        licenseNumber: product.manufacturerId.licenseNumber,
        email: product.manufacturerId.email,
        phone: product.manufacturerId.phoneNumber,
        address: product.manufacturerId.address
      },
      batchDetails: {
        quantityProduced: batch.quantityProduced,
        quantityAvailable: batch.quantityAvailable,
        quantityAssigned: batch.quantityAssigned,
        shipmentStatus: batch.shipmentStatus,
        storageConditions: batch.storageConditions
      },
      storageTemp: batch.storageConditions || product.storageCondition || '2°C to 8°C',
      humidity: '45% to 65%',
      journey: journey,
      fingerprint: product.fingerprint,
      blockchainVerified: batch.blockchainVerified,
      txHash: batch.txHash,
      blockNumber: batch.blockNumber,
      lastVerifiedBy: product.lastVerifiedBy || 'System',
      totalShipments: batch.shipmentHistory?.length || 0,
      createdAt: product.createdAt,
      updatedAt: batch.updatedAt
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

// Helper function to determine shipment step name
const getShipmentStepName = (status, index) => {
  switch (status.toLowerCase()) {
    case 'in transit':
      return 'In Transit';
    case 'delivered':
      return 'Delivered';
    case 'shipped':
      return 'Shipped';
    case 'received':
      return 'Received';
    case 'quality checked':
      return 'Quality Check';
    case 'stored':
      return 'Stored';
    case 'dispatched':
      return 'Dispatched';
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
};

module.exports = {
  trackProduct
};
