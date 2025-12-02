const Product = require('../models/Product');
const Batch = require('../models/Batch');
const User = require('../models/User');
const Manufacturer = require('../models/Manufacturer');
const Distributor = require('../models/Distributor');
const Pharmacist = require('../models/Pharmacist');
const ProductTracking = require('../models/ProductTracking');
const { contract: productContract, batchContract } = require('../utils/blockchain');

// Helper function to convert BigInt values to strings for JSON serialization
function convertBigIntsToStrings(obj) {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'bigint') return obj.toString();
  if (obj instanceof Date) return obj.toISOString(); // Handle Date objects properly
  if (Array.isArray(obj)) return obj.map(convertBigIntsToStrings);
  if (typeof obj === 'object') {
    const converted = {};
    for (const [key, value] of Object.entries(obj)) {
      converted[key] = convertBigIntsToStrings(value);
    }
    return converted;
  }
  return obj;
}

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

    // Get tracking type with validation
    const rawTrackingType = req.query?.trackingType || trackingData.trackingType || 'manual_verification';
    const validTrackingTypes = ['manual_verification', 'qr_scan', 'batch_verification', 'distributor_scan', 'pharmacy_scan'];
    const trackingType = validTrackingTypes.includes(rawTrackingType) ? rawTrackingType : 'manual_verification';

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

// Primary verification function - Blockchain first approach
const verifyProductBlockchainFirst = async (req, res) => {
  try {
    const { serialNumber } = req.params;

    if (!serialNumber) {
      return res.status(400).json({
        success: false,
        message: "Serial number is required",
        error: "MISSING_SERIAL_NUMBER"
      });
    }

    console.log("🔍 Starting blockchain-first verification for serial:", serialNumber);

    // Step 1: Try direct product lookup first (most reliable method based on diagnostic)
    let blockchainProduct;
    let productFromDB;
    
    // First, get product from database to have fallback data
    productFromDB = await Product.findOne({ serialNumber }).lean();
    console.log("📋 Product from database:", productFromDB ? "Found" : "Not found");
    
    // Try direct product lookup (this works according to our test)
    try {
      console.log("🔍 Attempting direct product lookup on blockchain...");
      blockchainProduct = await productContract.products(serialNumber);
      
      if (blockchainProduct && blockchainProduct.serialNumber === serialNumber && blockchainProduct.isActive) {
        console.log("✅ Found product directly on blockchain:", {
          name: blockchainProduct.name,
          serialNumber: blockchainProduct.serialNumber,
          batchNumber: blockchainProduct.batchNumber,
          manufacturerName: blockchainProduct.manufacturerName,
          isActive: blockchainProduct.isActive
        });
      } else {
        throw new Error("Product not found or inactive in direct mapping");
      }
    } catch (directError) {
      console.error("❌ Direct product lookup failed:", directError.message);
      
      // Fallback: Try fingerprint-based lookup
      let productFingerprint;
      try {
        productFingerprint = await productContract.getFingerprintBySerial(serialNumber);
        console.log("📋 Product fingerprint from blockchain:", productFingerprint);
        
        // Get product using fingerprint
        blockchainProduct = await productContract.getProductByFingerprint(productFingerprint);
        console.log("🔗 Product data from fingerprint:", blockchainProduct);
      } catch (fingerprintError) {
        console.error("❌ Fingerprint lookup failed:", fingerprintError.message);
        
        // Last resort: Try database fingerprint if available
        if (productFromDB && productFromDB.fingerprint) {
          console.log("🔄 Trying with database fingerprint:", productFromDB.fingerprint);
          try {
            blockchainProduct = await productContract.getProductByFingerprint(productFromDB.fingerprint);
            if (blockchainProduct && blockchainProduct.serialNumber === serialNumber) {
              console.log("✅ Found product using database fingerprint");
            } else {
              throw new Error("Product fingerprint mismatch");
            }
          } catch (dbFingerprintError) {
            console.log("❌ Database fingerprint lookup failed:", dbFingerprintError.message);
          }
        }
        
        // If all methods fail, return appropriate error
        if (!blockchainProduct) {
          return res.status(404).json({
            success: false,
            message: "Product not found on blockchain",
            error: "PRODUCT_NOT_FOUND",
            debug: {
              serialNumber,
              databaseFingerprint: productFromDB?.fingerprint,
              directLookupError: directError.message,
              fingerprintError: fingerprintError.message,
              productExistsInDB: !!productFromDB,
              txHash: productFromDB?.txHash,
              blockNumber: productFromDB?.blockNumber
            }
          });
        }
      }
    }

    // Step 3: Get batch data from blockchain
    let blockchainBatch;
    let batchFingerprint;
    try {
      // Try direct batch lookup using getBatch function
      console.log("🔍 Attempting direct batch lookup for:", blockchainProduct.batchNumber);
      const batchData = await batchContract.getBatch(blockchainProduct.batchNumber);
      
      if (batchData && batchData.batchNumber === blockchainProduct.batchNumber) {
        blockchainBatch = batchData;
        console.log("✅ Found batch directly on blockchain:", blockchainBatch.batchNumber);
        
        // Try to get batch fingerprint
        try {
          batchFingerprint = await batchContract.getFingerprintByBatch(blockchainProduct.batchNumber);
          console.log("📦 Batch fingerprint:", batchFingerprint);
        } catch (fingerprintError) {
          console.log("⚠️ Could not get batch fingerprint:", fingerprintError.message);
          batchFingerprint = 'N/A';
        }
      } else {
        throw new Error("Batch not found in direct mapping");
      }
    } catch (directBatchError) {
      console.error("❌ Direct batch lookup failed:", directBatchError.message);
      
      // Fallback: Try fingerprint-based batch lookup
      try {
        batchFingerprint = await batchContract.getFingerprintByBatch(blockchainProduct.batchNumber);
        console.log("📦 Batch fingerprint:", batchFingerprint);
        
        // Then get full batch data
        blockchainBatch = await batchContract.getBatchByFingerprint(batchFingerprint);
        console.log("🔗 Batch data from fingerprint:", blockchainBatch);
      } catch (batchError) {
        console.error("⚠️ Failed to get batch from blockchain:", batchError);
        // Continue without batch data but note the error
        blockchainBatch = null;
        batchFingerprint = null;
      }
    }

    // Step 4: Get shipment history from blockchain
    let shipmentHistory = [];
    try {
      if (blockchainBatch && blockchainProduct.batchNumber) {
b        // Get shipment history length first
        const historyLength = await batchContract.getBatchShipmentHistoryLength(blockchainProduct.batchNumber);
        console.log("🚚 Blockchain shipment history length:", historyLength.toString());
        
        if (historyLength > 0) {
          // Get full shipment history array
          shipmentHistory = await batchContract.getBatchShipmentHistory(blockchainProduct.batchNumber);
          console.log("🚚 Shipment history from blockchain:", shipmentHistory.length, "entries");
          
          // Log each entry for debugging
          shipmentHistory.forEach((entry, index) => {
            console.log(`📦 Shipment ${index + 1}:`, {
              timestamp: new Date(parseInt(entry.timestamp) * 1000),
              from: entry.from,
              to: entry.to,
              status: entry.status,
              quantity: entry.quantity.toString(),
              remarks: entry.remarks
            });
          });
        }
      }
    } catch (shipmentError) {
      console.error("⚠️ Failed to get shipment history from blockchain:", shipmentError);
    }

    // Step 5: Get supplementary data from MongoDB (manufacturer details, etc.)
    const dbProduct = await Product.findOne({ serialNumber }).populate('manufacturerId').lean();
    const dbBatch = await Batch.findOne({ batchNumber: blockchainProduct.batchNumber }).populate('manufacturerId').lean();
    
    let manufacturer = null;
    if (dbBatch && dbBatch.manufacturerId) {
      manufacturer = await Manufacturer.findOne({ user: dbBatch.manufacturerId._id }).populate('user').lean();
    }

    // Step 6: Process and format the data
    const currentDate = new Date();
    const expiryDate = new Date(parseInt(blockchainProduct.expiryDate) * 1000);
    const isExpired = currentDate > expiryDate;

    // Determine current location and actor from shipment history
    let currentLocation = 'Manufacturing Facility';
    let currentActor = blockchainProduct.manufacturerName || 'Unknown Manufacturer';
    
    if (shipmentHistory && shipmentHistory.length > 0) {
      const latestShipment = shipmentHistory[shipmentHistory.length - 1];
      currentLocation = latestShipment.to;
      currentActor = latestShipment.to;
    }

    // Format journey steps from blockchain shipment history
    const journeySteps = [];
    
    // Add manufacturing step
    journeySteps.push({
      step: 1,
      timestamp: new Date(parseInt(blockchainProduct.registrationTimestamp) * 1000),
      location: 'Manufacturing Facility',
      actor: {
        name: blockchainProduct.manufacturerName,
        type: 'Manufacturer',
        address: blockchainProduct.manufacturerAddress
      },
      status: 'Produced',
      description: `Product manufactured and registered on blockchain`,
      icon: 'Building2',
      isCompleted: true,
      environmentalConditions: {
        temperature: 'Controlled',
        humidity: 'Monitored',
        status: 'Normal'
      },
      qualityCheck: {
        result: 'Pass',
        notes: 'Product meets manufacturing standards'
      }
    });

    // Add shipment history steps with dynamic actor type detection
    if (shipmentHistory && shipmentHistory.length > 0) {
      // Get business type mapping for all actors
      const allBusinessNames = [...new Set(shipmentHistory.map(s => s.to))];
      const businessTypeMapping = {};
      
      try {
        const [distributors, pharmacists, manufacturers] = await Promise.all([
          Distributor.find({ companyName: { $in: allBusinessNames } }).populate('user').lean(),
          Pharmacist.find({ pharmacyName: { $in: allBusinessNames } }).populate('user').lean(),
          Manufacturer.find({ companyName: { $in: allBusinessNames } }).populate('user').lean()
        ]);
        
        distributors.forEach(d => businessTypeMapping[d.companyName] = 'distributor');
        pharmacists.forEach(p => businessTypeMapping[p.pharmacyName] = 'pharmacist');
        manufacturers.forEach(m => businessTypeMapping[m.companyName] = 'manufacturer');
      } catch (error) {
        console.error('Error mapping business types:', error);
      }
      
      for (let index = 0; index < shipmentHistory.length; index++) {
        const shipment = shipmentHistory[index];
        const actorType = businessTypeMapping[shipment.to] || 'unknown';
        
        journeySteps.push({
          step: index + 2,
          timestamp: new Date(parseInt(shipment.timestamp) * 1000),
          location: shipment.to,
          actor: {
            name: shipment.to,
            type: actorType.charAt(0).toUpperCase() + actorType.slice(1),
            address: shipment.toAddress
          },
          status: shipment.status,
          description: `${shipment.remarks || `Transferred to ${shipment.to}`}`,
          icon: getStepIcon(shipment.status),
          isCompleted: true,
          quantity: parseInt(shipment.quantity),
          environmentalConditions: {
            temperature: 'Monitored',
            humidity: 'Controlled',
            status: 'Normal'
          },
          qualityCheck: {
            result: 'Pass',
            notes: 'Chain of custody maintained'
          }
        });
      }
    }

    // Calculate authenticity score based on blockchain data
    const authenticityFactors = {
      blockchainVerified: true, // Data comes from blockchain
      hasValidBatch: !!blockchainBatch,
      hasShipmentHistory: shipmentHistory.length > 0,
      notExpired: !isExpired,
      hasManufacturerInfo: !!blockchainProduct.manufacturerName
    };

    const authenticityScore = Object.values(authenticityFactors).filter(Boolean).length * 20;
    const isAuthentic = authenticityScore >= 80;

    // Step 7: Create tracking record
    await trackProductVerification(req, {
      serialNumber,
      fingerprint: productFromDB?.fingerprint || 'N/A',
      batchNumber: blockchainProduct.batchNumber,
      productName: blockchainProduct.name,
      manufacturerName: blockchainProduct.manufacturerName,
      verificationResult: {
        isAuthentic: isAuthentic,
        status: isAuthentic ? 'verified' : 'suspicious'
      },
      authenticityScore,
      dataSource: 'blockchain'
    });

    // Step 8: Return comprehensive response
    return res.status(200).json({
      success: true,
      message: "Product verification completed successfully",
      dataSource: "blockchain",
      product: {
        // Basic product info from blockchain
        name: blockchainProduct.name,
        serialNumber: blockchainProduct.serialNumber,
        batchNumber: blockchainProduct.batchNumber,
        digitalFingerprint: productFromDB?.fingerprint || 'N/A',
        
        // Dates (convert from Unix timestamps)
        manufactureDate: new Date(parseInt(blockchainProduct.manufactureDate) * 1000),
        expiryDate: expiryDate,
        
        // Product specifications
        dosageForm: blockchainProduct.dosageForm,
        strength: blockchainProduct.strength,
        
        // Manufacturer info
        manufacturerName: blockchainProduct.manufacturerName,
        manufacturerAddress: blockchainProduct.manufacturerAddress,
        
        // Additional data from database if available
        price: dbProduct?.price,
        drugCode: dbProduct?.drugCode,
        qrCodeUrl: dbProduct?.qrCodeUrl,
        
        // Status
        isExpired,
        isAuthentic,
        currentLocation,
        currentActor
      },
      
      batch: blockchainBatch ? {
        batchNumber: blockchainBatch.batchNumber,
        digitalFingerprint: batchFingerprint,
        manufactureDate: new Date(parseInt(blockchainBatch.manufactureDate) * 1000),
        expiryDate: new Date(parseInt(blockchainBatch.expiryDate) * 1000),
        quantityProduced: parseInt(blockchainBatch.quantityProduced),
        quantityAvailable: parseInt(blockchainBatch.quantityAvailable),
        dosageForm: blockchainBatch.dosageForm,
        strength: blockchainBatch.strength,
        manufacturerName: blockchainBatch.manufacturerName,
        storageConditions: dbBatch?.storageConditions,
        productionLocation: dbBatch?.productionLocation
      } : null,
      
      manufacturer: manufacturer ? {
        name: manufacturer.companyName,
        registrationNumber: manufacturer.registrationNumber,
        walletAddress: manufacturer.user?.address
      } : {
        name: blockchainProduct.manufacturerName,
        walletAddress: blockchainProduct.manufacturerAddress
      },
      
      verification: {
        isAuthentic,
        authenticityScore,
        factors: authenticityFactors,
        verifiedAt: new Date(),
        verificationMethod: 'blockchain_primary'
      },
      
      journey: {
        currentStep: journeySteps.length,
        totalSteps: journeySteps.length,
        steps: journeySteps,
        shipmentHistory: shipmentHistory.map(shipment => ({
          timestamp: new Date(parseInt(shipment.timestamp) * 1000),
          from: shipment.from,
          to: shipment.to,
          fromAddress: shipment.fromAddress,
          toAddress: shipment.toAddress,
          status: shipment.status,
          quantity: parseInt(shipment.quantity),
          remarks: shipment.remarks
        }))
      },
      
      blockchain: {
        productFingerprint: productFromDB?.fingerprint || 'N/A',
        batchFingerprint,
        productContract: productContract.address,
        batchContract: batchContract.address,
        lastVerified: new Date()
      }
    });

  } catch (error) {
    console.error('❌ Blockchain verification error:', error);
    
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
        },
        dataSource: 'blockchain'
      });
      console.log('🔍 Blockchain verification error tracked:', req.params.serialNumber);
    } catch (trackingError) {
      console.error('❌ Error tracking failed verification:', trackingError);
    }
    
    return res.status(500).json({
      success: false,
      message: "Verification failed",
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Helper function to get actor type from database
async function getActorType(actorName) {
  if (!actorName) return 'Unknown';
  
  try {
    // Check in all three collections
    const [distributor, pharmacist, manufacturer] = await Promise.all([
      Distributor.findOne({ 
        $or: [
          { companyName: actorName },
          { 'user.address': actorName }
        ]
      }).populate('user').lean(),
      
      Pharmacist.findOne({ 
        $or: [
          { pharmacyName: actorName },
          { 'user.address': actorName }
        ]
      }).populate('user').lean(),
      
      Manufacturer.findOne({ 
        $or: [
          { companyName: actorName },
          { 'user.address': actorName }
        ]
      }).populate('user').lean()
    ]);
    
    if (distributor) return 'Distributor';
    if (pharmacist) return 'Pharmacist'; 
    if (manufacturer) return 'Manufacturer';
    
    return 'Unknown';
  } catch (error) {
    console.error('Error getting actor type:', error);
    return 'Unknown';
  }
}

function getStepIcon(status) {
  const iconMap = {
    'Produced': 'Building2',
    'In Transit': 'Truck',
    'Delivered': 'Store',
    'Received': 'Package'
  };
  return iconMap[status] || 'Package';
}

// Blockchain-based product verification API (equivalent to verificationController.verifyProduct)
const verifyProductBlockchain = async (req, res) => {
  try {
    const { serialNumber } = req.params;

    if (!serialNumber) {
      return res.status(400).json({
        success: false,
        message: 'Serial number is required'
      });
    }

    console.log("🔍 Starting blockchain product verification for:", serialNumber);

    // Step 1: Get product from blockchain using direct lookup (most reliable)
    let blockchainProduct;
    try {
      blockchainProduct = await productContract.products(serialNumber);
      
      if (!blockchainProduct || blockchainProduct.serialNumber !== serialNumber || !blockchainProduct.isActive) {
        throw new Error("Product not found or inactive");
      }
      
      console.log("✅ Product found on blockchain:", blockchainProduct.serialNumber);
    } catch (error) {
      console.error("❌ Product not found on blockchain:", error.message);
      
      // Track invalid attempts
      try {
        await trackProductVerification(req, {
          productId: null,
          manufacturerId: null,
          serialNumber,
          productName: null,
          verificationResult: {
            isAuthentic: false,
            status: 'not_found',
            isExpired: false
          }
        });
      } catch (trackingError) {
        console.error('❌ Error tracking verification:', trackingError);
      }

      return res.status(404).json({
        success: false,
        message: 'Product not found',
        isAuthentic: false
      });
    }

    // Step 2: Get batch data from blockchain
    let blockchainBatch;
    try {
      blockchainBatch = await batchContract.getBatch(blockchainProduct.batchNumber);
      if (!blockchainBatch || blockchainBatch.batchNumber !== blockchainProduct.batchNumber) {
        throw new Error("Batch not found");
      }
      
      console.log("✅ Batch found on blockchain:", blockchainBatch.batchNumber);
    } catch (batchError) {
      console.error("❌ Batch not found on blockchain:", batchError.message);
      return res.status(404).json({
        success: false,
        message: 'Batch information not found',
        isAuthentic: false
      });
    }

    // Step 3: Get shipment history
    let shipmentHistory = [];
    try {
      shipmentHistory = await batchContract.getBatchShipmentHistory(blockchainProduct.batchNumber);
      console.log("🚚 Shipment history entries:", shipmentHistory.length);
    } catch (shipmentError) {
      console.log("⚠️ No shipment history found:", shipmentError.message);
    }

    // Step 4: Get database fallback data for additional info
    const dbProduct = await Product.findOne({ serialNumber }).lean();
    const dbBatch = await Batch.findOne({ batchNumber: blockchainProduct.batchNumber }).populate('manufacturerId').lean();
    let manufacturer = null;
    if (dbBatch && dbBatch.manufacturerId) {
      manufacturer = await Manufacturer.findOne({ user: dbBatch.manufacturerId._id }).populate('user').lean();
    }

    // Step 4.1: Get verification status from blockchain
    let verificationStatus = {
      manufacturerVerified: true,
      distributorVerified: false,
      pharmacistVerified: false,
      manufacturerVerifiedAt: "0",
      distributorVerifiedAt: "0", 
      pharmacistVerifiedAt: "0"
    };

    try {
      // Check if getVerificationStatus function exists
      if (typeof batchContract.getVerificationStatus === 'function') {
        // First check if the batch exists in the blockchain
        const batchExists = await batchContract.batches(blockchainProduct.batchNumber);
        if (batchExists.manufacturerAddress === "0x0000000000000000000000000000000000000000") {
          throw new Error("Batch not registered in blockchain");
        }

        const blockchainVerificationStatus = await batchContract.getVerificationStatus(blockchainProduct.batchNumber);
        console.log("🔍 Raw blockchain verification status:", blockchainVerificationStatus);
        
        // Get verification timestamps from blockchain if available
        let distributorVerifiedAt = "0";
        let pharmacistVerifiedAt = "0";
        
        try {
          // Try to get actual verification timestamps from blockchain events or batch data
          if (blockchainVerificationStatus[0]) {
            // Check if there are verification timestamp functions available
            if (typeof batchContract.getDistributorVerificationTimestamp === 'function') {
              const timestamp = await batchContract.getDistributorVerificationTimestamp(blockchainProduct.batchNumber);
              distributorVerifiedAt = timestamp ? timestamp.toString() : "verified";
            } else {
              distributorVerifiedAt = "verified"; // Fallback when timestamp not available
            }
          }
          
          if (blockchainVerificationStatus[1]) {
            if (typeof batchContract.getPharmacistVerificationTimestamp === 'function') {
              const timestamp = await batchContract.getPharmacistVerificationTimestamp(blockchainProduct.batchNumber);
              pharmacistVerifiedAt = timestamp ? timestamp.toString() : "verified";
            } else {
              pharmacistVerifiedAt = "verified"; // Fallback when timestamp not available
            }
          }
        } catch (timestampError) {
          console.log("⚠️ Could not get verification timestamps from blockchain:", timestampError.message);
          distributorVerifiedAt = blockchainVerificationStatus[0] ? "verified" : "0";
          pharmacistVerifiedAt = blockchainVerificationStatus[1] ? "verified" : "0";
        }
        
        verificationStatus = {
          manufacturerVerified: true, // Always true for registered batches
          distributorVerified: blockchainVerificationStatus[0], // First return value
          pharmacistVerified: blockchainVerificationStatus[1], // Second return value
          manufacturerVerifiedAt: blockchainBatch?.registrationTimestamp ? blockchainBatch.registrationTimestamp.toString() : "0",
          distributorVerifiedAt,
          pharmacistVerifiedAt
        };
        console.log("✅ Blockchain verification status (processed):", verificationStatus);
      } else {
        console.log("⚠️ getVerificationStatus function not available - using batch data");
        verificationStatus = {
          manufacturerVerified: true,
          distributorVerified: blockchainBatch?.distributorVerified || false,
          pharmacistVerified: blockchainBatch?.pharmacistVerified || false,
          manufacturerVerifiedAt: blockchainBatch?.registrationTimestamp || "0",
          distributorVerifiedAt: blockchainBatch?.distributorVerified ? "verified" : "0",
          pharmacistVerifiedAt: blockchainBatch?.pharmacistVerified ? "verified" : "0"
        };
      }
    } catch (verificationError) {
      console.log("⚠️ Could not get verification status from blockchain:", verificationError.message);
      console.log("🔍 Using default verification status (manufacturer verified only)");
      
      // Keep default verification status - no database fallback for pure blockchain approach
      verificationStatus = {
        manufacturerVerified: true,
        distributorVerified: false,
        pharmacistVerified: false,
        manufacturerVerifiedAt: blockchainBatch?.registrationTimestamp ? blockchainBatch.registrationTimestamp.toString() : "0",
        distributorVerifiedAt: "0",
        pharmacistVerifiedAt: "0"
      };
      console.log("⚠️ Blockchain verification status (fallback):", verificationStatus);
    }

    // Step 5: Process dates and expiry
    const currentDate = new Date();
    const expiryDate = new Date(parseInt(blockchainProduct.expiryDate) * 1000);
    const isExpired = currentDate > expiryDate;
    const daysUntilExpiry = Math.ceil((expiryDate - currentDate) / (1000 * 60 * 60 * 24));

    // Step 6: Determine current location based on verification status
    let currentLocation = 'Manufacturing Facility';
    let currentActor = blockchainProduct.manufacturerName;
    let lastUpdated = new Date(parseInt(blockchainProduct.registrationTimestamp.toString()) * 1000);

    // Check verification status to determine actual current location
    if (shipmentHistory && shipmentHistory.length > 0) {
      const latestShipment = shipmentHistory[shipmentHistory.length - 1];
      
      // Get business type mapping from database to properly identify actor types
      const businessTypeMapping = {};
      
      // Collect all unique business names from shipment history
      const allBusinessNames = [...new Set(shipmentHistory.map(s => s.to))];
      
      // Query database to get actual business types
      try {
        const [distributors, pharmacists, manufacturers] = await Promise.all([
          Distributor.find({ companyName: { $in: allBusinessNames } }).populate('user').lean(),
          Pharmacist.find({ pharmacyName: { $in: allBusinessNames } }).populate('user').lean(),
          Manufacturer.find({ companyName: { $in: allBusinessNames } }).populate('user').lean()
        ]);
        
        // Map business names to their actual types
        distributors.forEach(d => {
          businessTypeMapping[d.companyName] = 'distributor';
          if (d.user?.address) businessTypeMapping[d.user.address] = 'distributor';
        });
        
        pharmacists.forEach(p => {
          businessTypeMapping[p.pharmacyName] = 'pharmacist';
          if (p.user?.address) businessTypeMapping[p.user.address] = 'pharmacist';
        });
        
        manufacturers.forEach(m => {
          businessTypeMapping[m.companyName] = 'manufacturer';
          if (m.user?.address) businessTypeMapping[m.user.address] = 'manufacturer';
        });
        
        console.log('📊 Business type mapping:', businessTypeMapping);
      } catch (mappingError) {
        console.error('⚠️ Failed to create business type mapping:', mappingError);
      }
      
      // Helper function to get business type
      const getBusinessType = (businessName) => {
        return businessTypeMapping[businessName] || 'unknown';
      };
      
      // Check if pharmacist has verified (most recent verification state)
      if (verificationStatus.pharmacistVerified) {
        // Find the latest pharmacy shipment
        const pharmacyShipment = Array.from(shipmentHistory).slice().reverse().find(s => 
          getBusinessType(s.to) === 'pharmacist' ||
          getBusinessType(s.toAddress) === 'pharmacist'
        );
        if (pharmacyShipment) {
          currentLocation = pharmacyShipment.to;
          currentActor = pharmacyShipment.to;
          lastUpdated = new Date(parseInt(pharmacyShipment.timestamp.toString()) * 1000);
        }
      } else if (verificationStatus.distributorVerified) {
        // Check if there's a pharmacy shipment after distributor verification
        const pharmacyShipment = Array.from(shipmentHistory).slice().reverse().find(s => 
          getBusinessType(s.to) === 'pharmacist' ||
          getBusinessType(s.toAddress) === 'pharmacist'
        );
        
        if (pharmacyShipment) {
          // Product assigned to pharmacy but not yet verified - in transit
          currentLocation = `In Transit to ${pharmacyShipment.to}`;
          currentActor = `En route to ${pharmacyShipment.to}`;
          lastUpdated = new Date(parseInt(pharmacyShipment.timestamp.toString()) * 1000);
        } else {
          // Product is still at distributor - find distributor shipment
          const distributorShipment = Array.from(shipmentHistory).slice().reverse().find(s => 
            getBusinessType(s.to) === 'distributor' ||
            getBusinessType(s.toAddress) === 'distributor'
          );
          if (distributorShipment) {
            currentLocation = distributorShipment.to;
            currentActor = distributorShipment.to;
            lastUpdated = new Date(parseInt(distributorShipment.timestamp.toString()) * 1000);
          }
        }
      } else {
        // Distributor hasn't verified yet - product in transit to distributor
        currentLocation = `In Transit to ${latestShipment.to}`;
        currentActor = `En route to ${latestShipment.to}`;
        lastUpdated = new Date(parseInt(latestShipment.timestamp.toString()) * 1000);
      }
    }

    // Step 7: Calculate authenticity
    const hasValidShipmentHistory = shipmentHistory.length > 0;
    const hasQualityChecks = shipmentHistory.some(s => s.remarks && s.remarks.toLowerCase().includes('quality'));
    const hasManufacturerInfo = !!blockchainProduct.manufacturerName;
    const hasValidBatch = !!blockchainBatch;
    const hasValidProduct = !!blockchainProduct.name;
    
    const isAuthentic = Boolean(
      hasValidBatch && hasValidProduct && hasManufacturerInfo && blockchainProduct.isActive
    );

    // Step 8: Track verification
    try {
      const status = isExpired ? 'expired' : (isAuthentic ? 'verified' : 'suspicious');
      await trackProductVerification(req, {
        productId: dbProduct?._id || null,
        manufacturerId: dbBatch?.manufacturerId?._id || null,
        serialNumber: blockchainProduct.serialNumber,
        productName: blockchainProduct.name,
        verificationResult: {
          isAuthentic,
          status,
          isExpired
        }
      });
    } catch (trackingError) {
      console.error('❌ Error tracking verification:', trackingError);
    }

    // Step 9: Format response (matching verificationController format)
    const response = {
      success: true,
      isAuthentic,
      isExpired,
      daysUntilExpiry,
      product: {
        productName: blockchainProduct.name,
        serialNumber: blockchainProduct.serialNumber,
        batchNumber: blockchainProduct.batchNumber,
        manufactureDate: new Date(parseInt(blockchainProduct.manufactureDate.toString()) * 1000),
        expiryDate: expiryDate,
        dosageForm: blockchainProduct.dosageForm,
        strength: blockchainProduct.strength,
        drugCode: dbProduct?.drugCode || blockchainProduct.drugCode,
        storageCondition: dbBatch?.storageConditions || "Store below 25°C",
        price: dbProduct?.price
      },
      manufacturer: {
        name: blockchainProduct.manufacturerName,
        license: manufacturer?.registrationNumber || dbProduct?.manufacturerLicense,
        country: blockchainProduct.manufacturerCountry || dbProduct?.manufacturerCountry,
        location: blockchainProduct.productionLocation || dbBatch?.productionLocation
      },
      ...(blockchainProduct.approvalCertificateId || dbProduct?.approvalCertId) && {
        regulatory: {
          approvalCertId: blockchainProduct.approvalCertificateId || dbProduct?.approvalCertId
        }
      },
      currentLocation: {
        location: currentLocation,
        actor: currentActor,
        lastUpdated: lastUpdated
      },
      blockchain: {
        verified: true,
        txHash: dbBatch?.txHash,
        blockNumber: dbBatch?.blockNumber
      },
      verification: {
        verifiedAt: new Date(),
        verificationStatus: isAuthentic ? 'verified' : 'suspicious',
        fingerprint: dbProduct?.fingerprint || 'N/A',
        manufacturerVerified: verificationStatus.manufacturerVerified,
        distributorVerified: verificationStatus.distributorVerified,
        pharmacistVerified: verificationStatus.pharmacistVerified,
        manufacturerVerifiedAt: verificationStatus.manufacturerVerifiedAt,
        distributorVerifiedAt: verificationStatus.distributorVerifiedAt,
        pharmacistVerifiedAt: verificationStatus.pharmacistVerifiedAt
      }
    };

    return res.json(convertBigIntsToStrings(response));

  } catch (error) {
    console.error('❌ Blockchain verification error:', error);
    
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
        },
        dataSource: 'blockchain'
      });
      console.log('🔍 Blockchain verification error tracked:', req.params.serialNumber);
    } catch (trackingError) {
      console.error('❌ Error tracking failed verification:', trackingError);
    }
    
    return res.status(500).json({
      success: false,
      message: 'Failed to verify product',
      error: error.message
    });
  }
};

// Blockchain-based product journey API (equivalent to verificationController.getProductJourney)
const getProductJourneyBlockchain = async (req, res) => {
  try {
    const { serialNumber } = req.params;

    if (!serialNumber) {
      return res.status(400).json({
        success: false,
        message: 'Serial number is required'
      });
    }

    console.log("🔍 Getting blockchain product journey for:", serialNumber);

    // Step 1: Get product from blockchain
    let blockchainProduct;
    try {
      blockchainProduct = await productContract.products(serialNumber);
      if (!blockchainProduct || blockchainProduct.serialNumber !== serialNumber) {
        throw new Error("Product not found");
      }
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Step 2: Get batch from blockchain
    let blockchainBatch;
    try {
      console.log("🔍 Looking for batch:", blockchainProduct.batchNumber);
      const batchData = await batchContract.getBatch(blockchainProduct.batchNumber);
      console.log("📦 Batch data from contract:", batchData);
      
      if (!batchData || !batchData.batchNumber || batchData.manufacturerAddress === '0x0000000000000000000000000000000000000000') {
        throw new Error("Batch not found or inactive");
      }
      
      console.log("✅ Batch found on blockchain:", batchData.batchNumber);
      blockchainBatch = batchData; // Use batch data directly like in verification function
    } catch (error) {
      console.error("❌ Batch lookup failed:", error.message);
      console.log("🔍 Batch number being searched:", blockchainProduct.batchNumber);
      return res.status(404).json({
        success: false,
        message: 'Batch information not found',
        debug: {
          batchNumber: blockchainProduct.batchNumber,
          error: error.message
        }
      });
    }

    // Step 3: Get shipment history from blockchain
    let shipmentHistory = [];
    try {
      // Get shipment history length first
      const historyLength = await batchContract.getBatchShipmentHistoryLength(blockchainProduct.batchNumber);
      console.log("🚚 Blockchain shipment history length:", historyLength.toString());
      
      if (historyLength > 0) {
        // Get full shipment history array
        shipmentHistory = await batchContract.getBatchShipmentHistory(blockchainProduct.batchNumber);
        console.log("🚚 Retrieved", shipmentHistory.length, "shipment entries from blockchain");
        
        // Log each entry for debugging
        shipmentHistory.forEach((entry, index) => {
          console.log(`📦 Shipment ${index + 1}:`, {
            timestamp: new Date(parseInt(entry.timestamp) * 1000).toISOString(),
            from: entry.from,
            to: entry.to,
            status: entry.status,
            quantity: entry.quantity.toString(),
            remarks: entry.remarks
          });
        });
      } else {
        console.log("📦 No shipment history found on blockchain");
      }
    } catch (error) {
      console.log("⚠️ Failed to get shipment history:", error.message);
    }

    // Step 4: Get database info for additional details
    const dbProduct = await Product.findOne({ serialNumber }).lean();
    const dbBatch = await Batch.findOne({ batchNumber: blockchainProduct.batchNumber }).populate('manufacturerId').lean();
    let manufacturer = null;
    if (dbBatch?.manufacturerId) {
      manufacturer = await Manufacturer.findOne({ user: dbBatch.manufacturerId._id }).populate('user').lean();
    }

    // Step 4.1: Get verification status from blockchain
    let verificationStatus = {
      manufacturerVerified: true,
      distributorVerified: false,
      pharmacistVerified: false,
      manufacturerVerifiedAt: "0",
      distributorVerifiedAt: "0", 
      pharmacistVerifiedAt: "0"
    };

    try {
      // First check if the batch exists in the blockchain
      const batchExists = await batchContract.batches(blockchainProduct.batchNumber);
      if (batchExists.manufacturerAddress === "0x0000000000000000000000000000000000000000") {
        throw new Error("Batch not registered in blockchain");
      }

      const blockchainVerificationStatus = await batchContract.getVerificationStatus(blockchainProduct.batchNumber);
      verificationStatus = {
        manufacturerVerified: true, // Always true for registered batches
        distributorVerified: blockchainVerificationStatus[0], // First return value
        pharmacistVerified: blockchainVerificationStatus[1], // Second return value
        manufacturerVerifiedAt: blockchainBatch?.registrationTimestamp || "0",
        distributorVerifiedAt: blockchainVerificationStatus[0] ? "verified" : "0",
        pharmacistVerifiedAt: blockchainVerificationStatus[1] ? "verified" : "0"
      };
      console.log("✅ Blockchain verification status for journey:", verificationStatus);
    } catch (verificationError) {
      console.log("⚠️ Could not get verification status from blockchain:", verificationError.message);
      
      // No database fallback - continue with default verification status
      console.log("📋 Using default verification status (journey) - no database fallback:", verificationStatus);
    }

    // Step 5: Build journey steps
    const journeySteps = [];

    // Add manufacturing step
    journeySteps.push({
      step: 'Manufactured',
      date: new Date(parseInt(blockchainProduct.registrationTimestamp) * 1000),
      time: new Date(parseInt(blockchainProduct.registrationTimestamp) * 1000).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      location: blockchainProduct.productionLocation || 'Manufacturing Facility',
      actor: blockchainProduct.manufacturerName,
      details: `Product manufactured under batch ${blockchainProduct.batchNumber}. Quality parameters verified and recorded.`,
      icon: 'Building2',
      verified: true,
      status: 'completed',
      temperature: '20-25°C',
      humidity: '45-65%',
      blockchain: {
        verified: true,
        txHash: dbBatch?.txHash,
        blockNumber: dbBatch?.blockNumber
      }
    });

    // Add shipment history steps
    if (shipmentHistory && shipmentHistory.length > 0) {
      const sortedHistory = Array.from(shipmentHistory).sort(
        (a, b) => parseInt(a.timestamp) - parseInt(b.timestamp)
      );

      // Get business type mapping for journey steps
      const allBusinessNames = [...new Set(sortedHistory.map(s => s.to))];
      const businessTypeMapping = {};
      
      try {
        const [distributors, pharmacists, manufacturers] = await Promise.all([
          Distributor.find({ companyName: { $in: allBusinessNames } }).populate('user').lean(),
          Pharmacist.find({ pharmacyName: { $in: allBusinessNames } }).populate('user').lean(),
          Manufacturer.find({ companyName: { $in: allBusinessNames } }).populate('user').lean()
        ]);
        
        distributors.forEach(d => businessTypeMapping[d.companyName] = 'distributor');
        pharmacists.forEach(p => businessTypeMapping[p.pharmacyName] = 'pharmacist');
        manufacturers.forEach(m => businessTypeMapping[m.companyName] = 'manufacturer');
      } catch (error) {
        console.error('Error mapping business types for journey:', error);
      }

      for (const [index, shipment] of sortedHistory.entries()) {
        const stepName = getJourneyStepName(shipment.to, shipment.status, businessTypeMapping);
        const businessType = businessTypeMapping[shipment.to] || 'unknown';
        
        // Determine completion status based on business type and verification status
        let isCompleted = false;
        if (businessType === 'distributor') {
          isCompleted = verificationStatus.distributorVerified;
        } else if (businessType === 'pharmacist') {
          isCompleted = verificationStatus.pharmacistVerified;
        } else {
          // For other types, use the old logic
          isCompleted = index < sortedHistory.length - 1 || 
                       shipment.status === 'Delivered' || 
                       shipment.status === 'Distributed';
        }

        const stepDate = new Date(parseInt(shipment.timestamp) * 1000);
        
        journeySteps.push({
          step: stepName,
          date: stepDate.toISOString().split('T')[0],
          time: stepDate.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
          }),
          location: shipment.to || 'Unknown Location',
          actor: shipment.to || 'Unknown Actor',
          details: shipment.remarks || getDefaultJourneyDetails(stepName, shipment),
          icon: getJourneyStepIcon(stepName),
          verified: true,
          status: isCompleted ? 'completed' : 'in_progress',
          temperature: 'Monitored',
          humidity: 'Controlled',
          qualityCheck: {
            result: 'Pass',
            notes: 'Chain of custody maintained'
          },
          quantity: parseInt(shipment.quantity)
        });
      }
    }

    // Step 6: Format response (matching verificationController format)
    const response = {
      success: true,
      product: {
        isAuthentic: blockchainProduct.isActive,
        productName: blockchainProduct.name,
        manufacturer: blockchainProduct.manufacturerName,
        serialNumber: blockchainProduct.serialNumber,
        batchNumber: blockchainProduct.batchNumber,
        manufactureDate: new Date(parseInt(blockchainProduct.manufactureDate) * 1000),
        expiryDate: new Date(parseInt(blockchainProduct.expiryDate) * 1000),
        dosageForm: blockchainProduct.dosageForm,
        strength: blockchainProduct.strength,
        packSize: null,
        regulatoryInfo: blockchainProduct.approvalCertificateId ? 
          `Blockchain Approved - ${blockchainProduct.approvalCertificateId}` : 
          `Batch: ${blockchainProduct.batchNumber}`
      },
      journey: journeySteps,
      blockchain: {
        verified: true,
        txHash: dbBatch?.txHash,
        blockNumber: dbBatch?.blockNumber,
        lastSync: new Date()
      },
      verification: {
        manufacturerVerified: verificationStatus.manufacturerVerified,
        distributorVerified: verificationStatus.distributorVerified,
        pharmacistVerified: verificationStatus.pharmacistVerified,
        manufacturerVerifiedAt: verificationStatus.manufacturerVerifiedAt,
        distributorVerifiedAt: verificationStatus.distributorVerifiedAt,
        pharmacistVerifiedAt: verificationStatus.pharmacistVerifiedAt
      }
    };

    return res.json(convertBigIntsToStrings(response));

  } catch (error) {
    console.error('❌ Blockchain journey error:', error);
    
    // Track failed journey requests for security monitoring
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
        },
        dataSource: 'blockchain'
      });
      console.log('🔍 Blockchain journey error tracked:', req.params.serialNumber);
    } catch (trackingError) {
      console.error('❌ Error tracking failed journey request:', trackingError);
    }
    
    return res.status(500).json({
      success: false,
      message: 'Failed to get product journey',
      error: error.message
    });
  }
};

// Helper functions for journey
// Dynamic journey step name based on actual business type from database
function getJourneyStepName(actorName, status, businessTypeMapping) {
  if (!actorName) return 'Unknown Step';
  
  // Get business type from mapping (passed from parent function)
  const businessType = businessTypeMapping[actorName] || 'unknown';
  
  // Check status for transit first
  if (status === 'In Transit') {
    return 'In Transit';
  }
  
  // Determine step name based on actual business type
  switch (businessType) {
    case 'manufacturer':
      return 'Manufacturing';
      
    case 'distributor':
      return status === 'Distributed' ? 'Distribution' : 'Distribution Center';
      
    case 'pharmacist':
      return status === 'Received' || status === 'Delivered' ? 'Pharmacy Received' : 'Pharmacy Processing';
      
    default:
      // For unknown types, try to infer from status
      if (status === 'Received' || status === 'Delivered') {
        return 'Received';
      }
      return 'Processing';
  }
}

function getJourneyStepIcon(stepName) {
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

function getDefaultJourneyDetails(stepName, shipment) {
  const detailsMap = {
    'Distribution': `Product distributed to ${shipment.to}. Quantity: ${shipment.quantity} units.`,
    'Distribution Center': `Product received at distribution center. Chain of custody maintained.`,
    'In Transit': `Product in transit from ${shipment.from} to ${shipment.to}.`,
    'Pharmacy Received': `Product successfully delivered and verified. Added to pharmacy inventory.`
  };
  return detailsMap[stepName] || `Product processed at ${stepName}.`;
}

module.exports = {
  verifyProductBlockchainFirst,
  trackProductVerification,
  verifyProductBlockchain,
  getProductJourneyBlockchain
};