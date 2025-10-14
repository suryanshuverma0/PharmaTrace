const Product = require('../models/Product');
const Batch = require('../models/Batch');
const User = require('../models/User');
const Manufacturer = require('../models/Manufacturer');
const Distributor = require('../models/Distributor');
const Pharmacist = require('../models/Pharmacist');
const ProductTracking = require('../models/ProductTracking');
// const locationTrackingService = require('../services/locationTrackingService');

// Helper function to track product verification
async function trackProductVerification(req, trackingData) {
  try {
    // Extract location data from query parameters
    const latitude = req.query?.latitude ? parseFloat(req.query.latitude) : null;
    const longitude = req.query?.longitude ? parseFloat(req.query.longitude) : null;
    const accuracy = req.query?.accuracy ? parseFloat(req.query.accuracy) : null;
    const locationTimestamp = req.query?.locationTimestamp ? new Date(req.query.locationTimestamp) : null;

    // Extract device information from query parameters
    const deviceType = req.query?.deviceType || 'unknown';
    const browser = req.query?.browser || 'Unknown';
    const platform = req.query?.platform || 'Unknown';
    const screenWidth = req.query?.screenWidth ? parseInt(req.query.screenWidth) : null;
    const screenHeight = req.query?.screenHeight ? parseInt(req.query.screenHeight) : null;

    // Get tracking type
    const trackingType = req.query?.trackingType || trackingData.trackingType || 'manual_verification';

    // Determine scan method based on tracking type
    let scanMethod = 'manual_entry';
    if (trackingType === 'qr_scan') {
      scanMethod = 'camera_scan';
    }

    // Get client IP address
    const ipAddress = req.ip || req.connection?.remoteAddress || req.headers['x-forwarded-for'] || 'unknown';

    // Create tracking record with simplified data structure
    const trackingRecord = {
      ...trackingData,
      trackingType,
      location: {
        latitude,
        longitude,
        accuracy,
        ipAddress: ipAddress.replace('::ffff:', '') // Clean IPv4-mapped IPv6 addresses
      },
      deviceInfo: {
        deviceType,
        browser: decodeURIComponent(browser),
        platform,
        screenWidth,
        screenHeight
      },
      scanMethod,
      scannedAt: new Date(),
      locationTimestamp
    };

    // Create tracking record
    const tracking = new ProductTracking(trackingRecord);
    await tracking.save();
    
    console.log('✅ Tracking record saved successfully:', tracking._id);
    return tracking;
  } catch (error) {
    console.error('❌ Error creating tracking record:', error);
    throw error;
  }
}

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
    let product = await Product.findOne({ serialNumber })
      .populate('manufacturerId', 'name address')
      .lean();

    if (!product) {
      // Track invalid serial number attempts for security monitoring
      try {
        await trackProductVerification(req, {
          productId: null,
          manufacturerId: null,
          serialNumber: serialNumber,
          productName: null,
          verificationResult: {
            isAuthentic: false,
            status: 'not_found',
            isExpired: false
          }
        });
        console.log('🔍 Invalid serial number attempt tracked:', serialNumber);
      } catch (trackingError) {
        console.error('❌ Error tracking invalid serial number:', trackingError);
      }

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
      // Track batch not found for security monitoring
      try {
        await trackProductVerification(req, {
          productId: product._id,
          manufacturerId: null,
          serialNumber: product.serialNumber,
          productName: product.productName,
          verificationResult: {
            isAuthentic: false,
            status: 'error',
            isExpired: false
          }
        });
        console.log('🔍 Batch not found tracked for product:', product.serialNumber);
      } catch (trackingError) {
        console.error('❌ Error tracking batch not found:', trackingError);
      }

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
    
    const isAuthentic = Boolean(
      // Basic blockchain verification
      (batch.txHash && batch.blockNumber) ||
      // Supply chain verification - product exists with valid batch and manufacturer
      (hasValidBatch && hasValidProduct && hasManufacturerInfo) ||
      // Additional verification through shipment history
      (hasValidShipmentHistory && hasQualityChecks)
    );

    // Calculate days until expiry
    const expiryDate = new Date(product.expiryDate || batch.expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));

    // Prepare verification result with only available data
    const verificationResult = {
      success: true,
      isAuthentic,
      isExpired,
      daysUntilExpiry,
      product: {
        productName: product.productName,
        serialNumber: product.serialNumber,
        batchNumber: product.batchNumber,
        ...(product.manufactureDate && { manufactureDate: product.manufactureDate }),
        ...(batch.manufactureDate && { manufactureDate: batch.manufactureDate }),
        ...(product.expiryDate && { expiryDate: product.expiryDate }),
        ...(batch.expiryDate && { expiryDate: batch.expiryDate }),
        ...(product.dosageForm && { dosageForm: product.dosageForm }),
        ...(batch.dosageForm && { dosageForm: batch.dosageForm }),
        ...(product.strength && { strength: product.strength }),
        ...(batch.strength && { strength: batch.strength }),
        ...(product.packSize && { packSize: product.packSize }),
        ...(product.drugCode && { drugCode: product.drugCode }),
        ...(product.storageCondition && { storageCondition: product.storageCondition }),
        ...(batch.storageConditions && { storageCondition: batch.storageConditions }),
        ...(product.price && { price: product.price })
      },
      manufacturer: {
        ...(manufacturer?.companyName && { name: manufacturer.companyName }),
        ...(product.manufacturerName && { name: product.manufacturerName }),
        ...(manufacturer?.registrationNumber && { license: manufacturer.registrationNumber }),
        ...(product.manufacturerLicense && { license: product.manufacturerLicense }),
        ...(product.manufacturerCountry && { country: product.manufacturerCountry }),
        ...(product.productionLocation && { location: product.productionLocation })
      },
      ...(product.approvalCertId || batch.approvalCertId) && {
        regulatory: {
          ...(product.approvalCertId && { approvalCertId: product.approvalCertId }),
          ...(batch.approvalCertId && { approvalCertId: batch.approvalCertId }),
          ...(product.regulatoryInfo?.licenseNumber && { licenseNumber: product.regulatoryInfo.licenseNumber }),
          ...(product.regulatoryInfo?.issuedBy && { issuedBy: product.regulatoryInfo.issuedBy }),
          ...(product.regulatoryInfo?.issuedDate && { issuedDate: product.regulatoryInfo.issuedDate }),
          ...(product.regulatoryInfo?.validUntil && { validUntil: product.regulatoryInfo.validUntil })
        }
      },
      currentLocation: {
        location: currentLocation,
        actor: currentActor,
        lastUpdated: batch.shipmentHistory?.length > 0 ? 
          batch.shipmentHistory[batch.shipmentHistory.length - 1].timestamp : 
          batch.createdAt
      },
      blockchain: {
        verified: Boolean(batch.blockchainVerified),
        ...(batch.txHash && { txHash: batch.txHash }),
        ...(batch.blockNumber && { blockNumber: batch.blockNumber }),
        ...(batch.contractAddress && { contractAddress: batch.contractAddress })
      },
      verification: {
        verifiedAt: new Date(),
        ...(product.verificationStatus && { verificationStatus: product.verificationStatus }),
        ...(product.fingerprint && { fingerprint: product.fingerprint }),
        ...(batch.digitalFingerprint && { fingerprint: batch.digitalFingerprint })
      }
    };

    // Track this verification for analytics and security
    try {
      // Determine the status based on authenticity and expiry
      let status = 'verified';
      if (!isAuthentic) {
        status = 'suspicious';
      } else if (isExpired) {
        status = 'expired';
      }

      await trackProductVerification(req, {
        productId: product._id,
        manufacturerId: batch.manufacturerId._id,
        serialNumber: product.serialNumber,
        productName: product.productName,
        verificationResult: {
          isAuthentic: Boolean(isAuthentic),
          status: status,
          isExpired: Boolean(isExpired)
        }
      });
      console.log('✅ Product verification tracked successfully');
    } catch (trackingError) {
      console.error('❌ Error tracking verification:', trackingError);
      // Don't fail the verification if tracking fails
    }

    res.json(verificationResult);

  } catch (error) {
    console.error('Error verifying product:', error);
    
    // Track failed verification attempts for security monitoring
    try {
      await trackProductVerification(req, {
        productId: null,
        manufacturerId: null,
        serialNumber: req.params.serialNumber,
        productName: null,
        verificationResult: {
          isAuthentic: false,
          status: 'error',
          isExpired: false
        }
      });
      console.log('🔍 Verification error tracked:', req.params.serialNumber);
    } catch (trackingError) {
      console.error('❌ Error tracking failed verification:', trackingError);
    }

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

// New function for fingerprint-based verification with blockchain support
exports.verifyProductByFingerprint = async (req, res) => {
  try {
    const { fingerprint } = req.params;

    if (!fingerprint) {
      return res.status(400).json({
        success: false,
        message: 'Digital fingerprint is required'
      });
    }

    console.log("Verifying product with fingerprint:", fingerprint);

    let product = null;
    let batch = null;
    let source = 'database';

    // Try blockchain first
    try {
      console.log("Attempting blockchain verification...");
      const { contract, batchContract } = require("../utils/blockchain");
      
      // Get product from blockchain using fingerprint
      const blockchainProduct = await contract.getProductByFingerprint(fingerprint);
      
      if (blockchainProduct && blockchainProduct.serialNumber) {
        console.log("Product found on blockchain:", blockchainProduct.serialNumber);
        
        // Format product data from blockchain
        product = {
          fingerprint: fingerprint,
          productName: blockchainProduct.name,
          serialNumber: blockchainProduct.serialNumber,
          batchNumber: blockchainProduct.batchNumber,
          manufactureDate: new Date(Number(blockchainProduct.manufactureDate) * 1000),
          expiryDate: new Date(Number(blockchainProduct.expiryDate) * 1000),
          manufacturerName: blockchainProduct.manufacturerName,
          manufacturerLicense: blockchainProduct.manufacturerLicense,
          productionLocation: blockchainProduct.productionLocation,
          drugCode: blockchainProduct.drugCode,
          dosageForm: blockchainProduct.dosageForm,
          strength: blockchainProduct.strength,
          storageCondition: blockchainProduct.storageCondition,
          approvalCertId: blockchainProduct.approvalCertificateId,
          manufacturerCountry: blockchainProduct.manufacturerCountry,
          manufacturerAddress: blockchainProduct.manufacturerAddress,
          registrationTimestamp: new Date(Number(blockchainProduct.registrationTimestamp) * 1000),
          isActive: blockchainProduct.isActive
        };

        // Get batch data from blockchain
        try {
          const blockchainBatch = await batchContract.getBatch(blockchainProduct.batchNumber);
          if (blockchainBatch && blockchainBatch.batchNumber) {
            batch = {
              digitalFingerprint: blockchainBatch.digitalFingerprint,
              batchNumber: blockchainBatch.batchNumber,
              manufactureDate: new Date(Number(blockchainBatch.manufactureDate) * 1000),
              expiryDate: new Date(Number(blockchainBatch.expiryDate) * 1000),
              quantityProduced: Number(blockchainBatch.quantityProduced),
              quantityAvailable: Number(blockchainBatch.quantityAvailable),
              dosageForm: blockchainBatch.dosageForm,
              strength: blockchainBatch.strength,
              storageConditions: blockchainBatch.storageConditions,
              productionLocation: blockchainBatch.productionLocation,
              approvalCertId: blockchainBatch.approvalCertId,
              manufacturerName: blockchainBatch.manufacturerName,
              manufacturerCountry: blockchainBatch.manufacturerCountry,
              manufacturerAddress: blockchainBatch.manufacturerAddress,
              registrationTimestamp: new Date(Number(blockchainBatch.registrationTimestamp) * 1000),
              isActive: blockchainBatch.isActive
            };

            // Get shipment history from blockchain
            try {
              const shipmentHistory = await batchContract.getBatchShipmentHistory(blockchainProduct.batchNumber);
              batch.shipmentHistory = shipmentHistory.map(entry => ({
                timestamp: new Date(Number(entry.timestamp) * 1000),
                from: entry.from,
                to: entry.to,
                fromAddress: entry.fromAddress,
                toAddress: entry.toAddress,
                status: entry.status,
                quantity: Number(entry.quantity),
                remarks: entry.remarks,
                actor: {
                  name: entry.actorName,
                  type: entry.actorType,
                  license: entry.actorLicense,
                  location: entry.actorLocation
                }
              }));
            } catch (shipmentError) {
              console.log("Could not fetch shipment history:", shipmentError.message);
              batch.shipmentHistory = [];
            }
          }
        } catch (batchError) {
          console.log("Could not fetch batch from blockchain:", batchError.message);
        }

        source = 'blockchain';
      }
    } catch (blockchainError) {
      console.log("Blockchain verification failed, trying database:", blockchainError.message);
    }

    // Fallback to database if blockchain failed
    if (!product) {
      console.log("Attempting database verification...");
      
      // Find product by fingerprint in database
      const dbProduct = await Product.findOne({ fingerprint })
        .populate('manufacturerId', 'name address')
        .lean();

      if (!dbProduct) {
        // Track invalid fingerprint attempts
        try {
          await trackProductVerification(req, {
            productId: null,
            manufacturerId: null,
            serialNumber: null,
            productName: null,
            verificationResult: {
              isAuthentic: false,
              status: 'not_found',
              isExpired: false
            }
          });
        } catch (trackingError) {
          console.error('❌ Error tracking invalid fingerprint:', trackingError);
        }

        return res.status(404).json({
          success: false,
          message: 'Product not found with this fingerprint',
          isAuthentic: false
        });
      }

      product = dbProduct;

      // Find the batch information from database
      batch = await Batch.findOne({ batchNumber: product.batchNumber })
        .populate('manufacturerId', 'name address')
        .lean();

      if (!batch) {
        return res.status(404).json({
          success: false,
          message: 'Batch information not found',
          isAuthentic: false
        });
      }

      source = 'database';
    }

    // Check if product is expired
    const currentDate = new Date();
    const expiryDate = product.expiryDate;
    const isExpired = expiryDate < currentDate;

    // Determine verification status
    let verificationStatus = 'verified';
    let isAuthentic = true;

    if (isExpired) {
      verificationStatus = 'expired';
      isAuthentic = false;
    } else if (!product.isActive && source === 'blockchain') {
      verificationStatus = 'inactive';
      isAuthentic = false;
    }

    // Track the verification
    try {
      await trackProductVerification(req, {
        productId: product._id || null,
        manufacturerId: batch.manufacturerId || null,
        serialNumber: product.serialNumber,
        productName: product.productName,
        verificationResult: {
          isAuthentic,
          status: verificationStatus,
          isExpired
        }
      });
      console.log('✅ Fingerprint verification tracked successfully');
    } catch (trackingError) {
      console.error('❌ Error tracking fingerprint verification:', trackingError);
    }

    // Prepare response
    const response = {
      success: true,
      isAuthentic,
      verificationStatus,
      isExpired,
      source,
      product: {
        fingerprint: product.fingerprint || fingerprint,
        name: product.productName,
        serialNumber: product.serialNumber,
        batchNumber: product.batchNumber,
        manufactureDate: product.manufactureDate,
        expiryDate: product.expiryDate,
        manufacturerName: product.manufacturerName,
        manufacturerLicense: product.manufacturerLicense,
        productionLocation: product.productionLocation,
        drugCode: product.drugCode,
        dosageForm: product.dosageForm,
        strength: product.strength,
        storageCondition: product.storageCondition,
        approvalCertId: product.approvalCertId,
        manufacturerCountry: product.manufacturerCountry,
        price: product.price
      },
      batch: batch ? {
        digitalFingerprint: batch.digitalFingerprint,
        batchNumber: batch.batchNumber,
        manufactureDate: batch.manufactureDate,
        expiryDate: batch.expiryDate,
        quantityProduced: batch.quantityProduced,
        quantityAvailable: batch.quantityAvailable,
        dosageForm: batch.dosageForm,
        strength: batch.strength,
        storageConditions: batch.storageConditions,
        productionLocation: batch.productionLocation,
        approvalCertId: batch.approvalCertId,
        manufacturerName: batch.manufacturerName,
        shipmentHistory: batch.shipmentHistory || []
      } : null,
      verificationTimestamp: new Date()
    };

    return res.json(response);

  } catch (error) {
    console.error('❌ Fingerprint verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify product',
      error: error.message
    });
  }
};

// Verify product by digital fingerprint (blockchain)
exports.verifyProductBlockchain = async (req, res) => {
  try {
    const { fingerprint } = req.params;
    if (!fingerprint) {
      return res.status(400).json({ success: false, message: 'Digital fingerprint is required' });
    }
    // Get contracts
    const { contract, batchContract } = require('../utils/blockchain');
    // Get product from blockchain
    const product = await contract.getProductByFingerprint(fingerprint);
    if (!product || !product.serialNumber) {
      return res.status(404).json({ success: false, message: 'Product not found on blockchain', isAuthentic: false });
    }
    // Get batch from blockchain
    let batch = null;
    try {
      batch = await batchContract.getBatch(product.batchNumber);
    } catch (err) {
      batch = null;
    }
    // Format current location and actor
    let currentLocation = 'Manufacturing Facility';
    let currentActor = product.manufacturerName || 'Unknown Manufacturer';
    // Shipment history from blockchain (if available)
    let shipmentHistory = [];
    try {
      shipmentHistory = await batchContract.getBatchShipmentHistory(product.batchNumber);
      shipmentHistory = shipmentHistory.map(entry => ({
        timestamp: new Date(Number(entry.timestamp) * 1000),
        from: entry.from,
        to: entry.to,
        fromAddress: entry.fromAddress,
        toAddress: entry.toAddress,
        status: entry.status,
        quantity: Number(entry.quantity),
        remarks: entry.remarks
      }));
      if (shipmentHistory.length > 0) {
        const latestShipment = shipmentHistory.sort((a, b) => b.timestamp - a.timestamp)[0];
        currentLocation = latestShipment.to || latestShipment.from;
        currentActor = latestShipment.to || latestShipment.from;
      }
    } catch (err) {
      shipmentHistory = [];
    }
    // Check expiry
    const expiryDate = new Date(Number(product.expiryDate) * 1000);
    const today = new Date();
    const isExpired = today > expiryDate;
    const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
    // Authenticity
    const isAuthentic = !!product.serialNumber && !!product.batchNumber && !!product.manufacturerName;
    // Format response
    const verificationResult = {
      success: true,
      isAuthentic,
      isExpired,
      daysUntilExpiry,
      product: {
        productName: product.name,
        serialNumber: product.serialNumber,
        batchNumber: product.batchNumber,
        manufactureDate: new Date(Number(product.manufactureDate) * 1000),
        expiryDate,
        dosageForm: product.dosageForm,
        strength: product.strength
      },
      manufacturer: {
        name: product.manufacturerName
      },
      currentLocation: {
        location: currentLocation,
        actor: currentActor,
        lastUpdated: shipmentHistory.length > 0 ? shipmentHistory[shipmentHistory.length - 1].timestamp : new Date(Number(product.manufactureDate) * 1000)
      },
      blockchain: {
        verified: true,
        fingerprint,
        contractAddress: contract.target
      },
      verification: {
        verifiedAt: new Date(),
        verificationStatus: isAuthentic ? 'verified' : 'suspicious',
        fingerprint
      },
      shipmentHistory
    };
    res.json(verificationResult);
  } catch (error) {
    console.error('Blockchain verification error:', error);
    res.status(500).json({ success: false, message: 'Failed to verify product on blockchain', error: error.message });
  }
};
