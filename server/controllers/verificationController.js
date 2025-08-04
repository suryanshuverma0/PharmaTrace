const Product = require('../models/Product');
const Batch = require('../models/Batch');
const User = require('../models/User');
const Manufacturer = require('../models/Manufacturer');
const Distributor = require('../models/Distributor');
const Pharmacist = require('../models/Pharmacist');

// Verify product by serial number
exports.verifyProduct = async (req, res) => {
  try {
    const { serialNumber } = req.params;

    if (!serialNumber) {
      return res.status(400).json({
        success: false,
        message: 'Serial number is required'
      });
    }

    // Find the product by serial number
    const product = await Product.findOne({ serialNumber })
      .populate('manufacturerId', 'name address')
      .lean();

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
        isAuthentic: false
      });
    }

    // Find the batch information
    const batch = await Batch.findOne({ batchNumber: product.batchNumber })
      .populate('manufacturerId', 'name address')
      .lean();

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch information not found',
        isAuthentic: false
      });
    }

    // Get manufacturer details
    const manufacturer = await Manufacturer.findOne({ user: batch.manufacturerId })
      .populate('user', 'name address')
      .lean();

    // Determine current location based on latest shipment
    let currentLocation = 'Manufacturing Facility';
    let currentActor = manufacturer?.companyName || 'Unknown Manufacturer';
    
    if (batch.shipmentHistory && batch.shipmentHistory.length > 0) {
      const latestShipment = batch.shipmentHistory
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
      
      if (latestShipment) {
        currentLocation = latestShipment.actor?.location || latestShipment.to;
        currentActor = latestShipment.actor?.name || latestShipment.to;
      }
    }

    // Check if product is expired
    const isExpired = new Date() > new Date(product.expiryDate || batch.expiryDate);
    
    // Check authenticity based on various factors
    const hasValidShipmentHistory = batch.shipmentHistory && batch.shipmentHistory.length > 0;
    const hasQualityChecks = batch.shipmentHistory && batch.shipmentHistory.some(shipment => 
      shipment.qualityCheck && shipment.qualityCheck.result === 'Pass'
    );
    const hasManufacturerInfo = manufacturer && manufacturer.companyName;
    const hasValidBatch = batch && batch.batchNumber;
    const hasValidProduct = product && product.productName;
    
    const isAuthentic = 
      // product.verificationStatus === 'Verified' || 
      // product.isAuthentic || 
      // batch.blockchainVerified || 
      (batch.txHash && batch.blockNumber) ||
      // Additional authenticity checks for products with valid supply chain data
      (hasValidShipmentHistory && hasQualityChecks && hasManufacturerInfo && hasValidBatch && hasValidProduct);

    // Calculate days until expiry
    const expiryDate = new Date(product.expiryDate || batch.expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));

    // Prepare verification result
    const verificationResult = {
      success: true,
      isAuthentic,
      isExpired,
      daysUntilExpiry,
      product: {
        productName: product.productName,
        serialNumber: product.serialNumber,
        batchNumber: product.batchNumber,
        manufactureDate: product.manufactureDate || batch.manufactureDate,
        expiryDate: product.expiryDate || batch.expiryDate,
        dosageForm: product.dosageForm || batch.dosageForm,
        strength: product.strength || batch.strength,
        packSize: product.packSize,
        drugCode: product.drugCode,
        storageCondition: product.storageCondition || batch.storageConditions,
        price: product.price
      },
      manufacturer: {
        name: manufacturer?.companyName || product.manufacturerName,
        license: manufacturer?.registrationNumber || product.manufacturerLicense,
        country: product.manufacturerCountry,
        location: product.productionLocation
      },
      regulatory: {
        approvalCertId: product.approvalCertId || batch.approvalCertId,
        licenseNumber: product.regulatoryInfo?.licenseNumber,
        issuedBy: product.regulatoryInfo?.issuedBy,
        issuedDate: product.regulatoryInfo?.issuedDate,
        validUntil: product.regulatoryInfo?.validUntil
      },
      currentLocation: {
        location: currentLocation,
        actor: currentActor,
        lastUpdated: batch.shipmentHistory?.length > 0 ? 
          batch.shipmentHistory[batch.shipmentHistory.length - 1].timestamp : 
          batch.createdAt
      },
      blockchain: {
        verified: batch.blockchainVerified,
        txHash: batch.txHash,
        blockNumber: batch.blockNumber,
        contractAddress: batch.contractAddress
      },
      verification: {
        verifiedAt: new Date(),
        verificationStatus: product.verificationStatus,
        fingerprint: product.fingerprint || batch.digitalFingerprint
      }
    };

    res.json(verificationResult);

  } catch (error) {
    console.error('Error verifying product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify product',
      error: error.message
    });
  }
};

// Get product journey/tracking information
exports.getProductJourney = async (req, res) => {
  try {
    const { serialNumber } = req.params;

    if (!serialNumber) {
      return res.status(400).json({
        success: false,
        message: 'Serial number is required'
      });
    }

    // Find the product
    const product = await Product.findOne({ serialNumber }).lean();
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Find the batch with populated shipment history
    const batch = await Batch.findOne({ batchNumber: product.batchNumber })
      .populate('manufacturerId', 'name address')
      .lean();

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch information not found'
      });
    }

    // Get manufacturer details
    const manufacturer = await Manufacturer.findOne({ user: batch.manufacturerId })
      .populate('user', 'name address')
      .lean();

    // Process journey steps from shipment history
    const journeySteps = [];

    // Add manufacturing step
    journeySteps.push({
      step: 'Manufacturing',
      date: batch.manufactureDate,
      time: new Date(batch.manufactureDate).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      location: batch.productionLocation || manufacturer?.user?.address || 'Manufacturing Facility',
      actor: manufacturer?.companyName || 'Manufacturer',
      details: `Product manufactured under batch ${batch.batchNumber}. Quality parameters verified and recorded.`,
      icon: 'Building2',
      verified: true,
      status: 'completed',
      temperature: batch.storageConditions || '20-25°C',
      humidity: '45-65%',
      blockchain: {
        verified: batch.blockchainVerified,
        txHash: batch.txHash,
        blockNumber: batch.blockNumber
      }
    });

    // Process shipment history
    if (batch.shipmentHistory && batch.shipmentHistory.length > 0) {
      const sortedHistory = batch.shipmentHistory.sort(
        (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
      );

      for (const [index, shipment] of sortedHistory.entries()) {
        const stepName = getStepName(shipment.actor?.type, shipment.status, index);
        const isCompleted = index < sortedHistory.length - 1 || 
                           shipment.status === 'Delivered' || 
                           shipment.status === 'Distributed';

        journeySteps.push({
          step: stepName,
          date: new Date(shipment.timestamp).toISOString().split('T')[0],
          time: new Date(shipment.timestamp).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
          }),
          location: shipment.actor?.location || shipment.to || 'Unknown Location',
          actor: shipment.actor?.name || shipment.to || 'Unknown Actor',
          details: shipment.remarks || getDefaultDetails(stepName, shipment),
          icon: getStepIcon(stepName),
          verified: !!shipment.verifiedBy,
          status: isCompleted ? 'completed' : 'in_progress',
          temperature: shipment.environmentalConditions?.temperature,
          humidity: shipment.environmentalConditions?.humidity,
          qualityCheck: shipment.qualityCheck,
          quantity: shipment.quantity,
          license: shipment.actor?.license
        });
      }
    }

    // Prepare response
    const journeyData = {
      success: true,
      product: {
        isAuthentic: product.isAuthentic || batch.blockchainVerified,
        productName: product.productName,
        manufacturer: manufacturer?.companyName || product.manufacturerName,
        serialNumber: product.serialNumber,
        batchNumber: product.batchNumber,
        manufactureDate: product.manufactureDate || batch.manufactureDate,
        expiryDate: product.expiryDate || batch.expiryDate,
        dosageForm: product.dosageForm || batch.dosageForm,
        strength: product.strength || batch.strength,
        packSize: product.packSize,
        regulatoryInfo: product.regulatoryInfo?.licenseNumber ? 
          `${product.regulatoryInfo.issuedBy} Approved - ${product.regulatoryInfo.licenseNumber}` : 
          `Batch: ${batch.batchNumber}`
      },
      journey: journeySteps,
      blockchain: {
        verified: batch.blockchainVerified,
        txHash: batch.txHash,
        blockNumber: batch.blockNumber,
        lastSync: batch.lastBlockchainSync
      }
    };

    res.json(journeyData);

  } catch (error) {
    console.error('Error getting product journey:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get product journey',
      error: error.message
    });
  }
};

// Helper functions
function getStepName(actorType, status, index) {
  if (actorType === 'Distributor') {
    return status === 'Distributed' ? 'Distribution' : 'Distribution Center';
  }
  if (actorType === 'Pharmacist' || actorType === 'Pharmacy') {
    return 'Pharmacy Received';
  }
  if (status === 'In Transit') {
    return 'In Transit';
  }
  return `Step ${index + 1}`;
}

function getStepIcon(stepName) {
  const iconMap = {
    'Manufacturing': 'Building2',
    'Quality Control': 'Clipboard',
    'Distribution': 'Truck',
    'Distribution Center': 'Truck',
    'In Transit': 'Truck',
    'Pharmacy Received': 'Store'
  };
  return iconMap[stepName] || 'Package';
}

function getDefaultDetails(stepName, shipment) {
  const detailsMap = {
    'Distribution': `Product distributed to ${shipment.to}. Quantity: ${shipment.quantity} units.`,
    'Distribution Center': `Product received at distribution center. Chain of custody maintained.`,
    'In Transit': `Product in transit from ${shipment.from} to ${shipment.to}.`,
    'Pharmacy Received': `Product successfully delivered and verified. Added to pharmacy inventory.`
  };
  return detailsMap[stepName] || `Product processed at ${stepName}.`;
}
