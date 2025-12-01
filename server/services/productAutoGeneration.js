const cron = require('node-cron');
const crypto = require('crypto');
const QRCode = require('qrcode');

const Batch = require('../models/Batch');
const Product = require('../models/Product');
const Manufacturer = require('../models/Manufacturer');
const { contract, signer } = require('../utils/blockchain');

class ProductAutoGenerationService {
  constructor() {
    this.processingBatches = new Set();
    // Control variable - set to null/empty to generate all products, or set a number to limit
    this.MAX_AUTO_PRODUCTS = 5; // null = generate all, number = limit generation
    this.init();
  }

  // Generate realistic pharmaceutical serial number
  generateMedicineSerialNumber(batchNumber, sequenceNum, productName) {
    // Format: [Company Code][Product Code][Batch][Sequence]
    // Example: PHT-PAR500-BN2025AA-000001
    const companyCode = 'PHT'; // PharmaTrace
    const productCode = this.generateProductCode(productName);
    const sequence = String(sequenceNum).padStart(6, '0');
    return `${companyCode}-${productCode}-${batchNumber}-${sequence}`;
  }

  // Generate product code from product name
  generateProductCode(productName) {
    // Extract key parts and create code
    // Example: "Paracetamol 500mg Tablets" -> "PAR500"
    const words = productName.toUpperCase().replace(/[^A-Z0-9\s]/g, '').split(' ');
    let code = '';
    
    // Take first 3 letters of main drug name
    if (words[0]) {
      code += words[0].substring(0, 3);
    }
    
    // Add strength if available
    const strengthMatch = productName.match(/\d+\s*(mg|g|ml|mcg)/i);
    if (strengthMatch) {
      code += strengthMatch[0].replace(/\s/g, '').toUpperCase();
    }
    
    return code;
  }

  // Generate realistic drug code (NDC-like format)
  generateDrugCode(batchNumber, productName) {
    // Format: 12345-678-90 (NDC-like)
    const manufacturerCode = '12345'; // Fixed manufacturer code
    const productCode = this.hashToNumber(productName, 3);
    const packageCode = this.hashToNumber(batchNumber, 2);
    return `${manufacturerCode}-${productCode}-${packageCode}`;
  }

  // Convert string to numeric code
  hashToNumber(str, length) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash + str.charCodeAt(i)) & 0xffffff;
    }
    return String(Math.abs(hash)).padStart(length, '0').substring(0, length);
  }

  init() {
    // Run every 5 minutes to check for any missed batches (backup mechanism)
    cron.schedule('*/5 * * * *', () => {
      console.log('🕐 Backup check for pending batches...');
      this.processPendingBatches().catch(console.error);
    });
    
    console.log('🤖 Auto Product Generation Service started - immediate generation enabled with 5-minute backup checks');
  }

  async processPendingBatches() {
    try {
      const pendingBatches = await Batch.find({
        autoGenerateProducts: true,
        productGenerationStatus: 'pending',
        quantityAvailable: { $gt: 0 }
      }).limit(3); // Process max 3 batches at once

      console.log(`📊 Found ${pendingBatches.length} pending batches for auto-generation`);

      if (pendingBatches.length === 0) {
        // Check if there are any batches at all
        const totalBatches = await Batch.countDocuments();
        const autoGenBatches = await Batch.countDocuments({ autoGenerateProducts: true });
        const pendingCount = await Batch.countDocuments({ productGenerationStatus: 'pending' });
        
        console.log(`📋 Total batches: ${totalBatches}, Auto-gen enabled: ${autoGenBatches}, Pending status: ${pendingCount}`);
      }

      for (const batch of pendingBatches) {
        if (!this.processingBatches.has(batch._id.toString())) {
          console.log(`🚀 Starting auto-generation for batch: ${batch.batchNumber}`);
          this.generateProductsForBatch(batch).catch(console.error);
        }
      }
    } catch (error) {
      console.error('❌ Error processing pending batches:', error);
    }
  }

  async generateProductsForBatch(batch) {
    const batchId = batch._id.toString();
    
    // Check if already processing
    if (this.processingBatches.has(batchId)) {
      console.log(`⚠️ Batch ${batch.batchNumber} is already being processed`);
      return;
    }
    
    this.processingBatches.add(batchId);

    try {
      console.log(`🚀 Starting auto-generation for batch: ${batch.batchNumber} (${batch.quantityProduced} units)`);

      // Update status
      batch.productGenerationStatus = 'processing';
      await batch.save();
      console.log(`📋 Updated batch status to processing`);

      // Get manufacturer
      const manufacturer = await Manufacturer.findOne({ user: batch.manufacturerId });
      if (!manufacturer) {
        throw new Error('Manufacturer not found');
      }

      const products = [];
      // Use MAX_AUTO_PRODUCTS control variable
      const autoGenerateCount = this.MAX_AUTO_PRODUCTS ? 
        Math.min(this.MAX_AUTO_PRODUCTS, batch.quantityProduced) : 
        batch.quantityProduced;

      console.log(`📊 Generating ${autoGenerateCount} products automatically`);
      
      // Validate required fields
      if (!batch.productName) {
        throw new Error('Product name is missing from batch');
      }
      if (!batch.batchNumber) {
        throw new Error('Batch number is missing');
      }

      // Generate products with sequential serial numbers
      for (let i = 0; i < autoGenerateCount; i++) {
        const serialNumber = this.generateMedicineSerialNumber(batch.batchNumber, i + 1, batch.productName);
        const drugCode = this.generateDrugCode(batch.batchNumber, batch.productName);
        
        // Generate fingerprint
        const fingerprint = crypto
          .createHash('sha256')
          .update(serialNumber + batch.batchNumber + manufacturer.companyName + Date.now())
          .digest('hex');

        // Generate QR code
        const qrData = {
          fingerprint,
          serialNumber,
          batchNumber: batch.batchNumber,
          productName: batch.productName,
          manufacturer: manufacturer.companyName,
          manufactureDate: batch.manufactureDate,
          expiryDate: batch.expiryDate,
          drugCode
        };

        let qrCodeUrl;
        try {
          qrCodeUrl = await QRCode.toDataURL(JSON.stringify(qrData));
        } catch (qrError) {
          qrCodeUrl = null;
        }

        products.push({
          manufacturerId: batch.manufacturerId,
          batchId: batch._id,
          productName: batch.productName,
          serialNumber,
          batchNumber: batch.batchNumber,
          manufactureDate: batch.manufactureDate,
          expiryDate: batch.expiryDate,
          manufacturerName: manufacturer.companyName,
          manufacturerLicense: batch.approvalCertId || '',
          productionLocation: batch.productionLocation || '',
          drugCode,
          dosageForm: batch.dosageForm || '',
          strength: batch.strength,
          storageCondition: batch.storageConditions || '',
          approvalCertId: batch.approvalCertId,
          manufacturerCountry: 'Nepal',
          fingerprint,
          qrCodeUrl,
          price: 0, // Default price
          isAuthentic: false, // Will be true after blockchain registration
          autoGenerated: true
        });
      }

      // Bulk insert products
      await Product.insertMany(products);
      console.log(`✅ Generated ${products.length} products for batch ${batch.batchNumber}`);

      // Update batch - reduce quantityAvailable by generated amount only
      batch.quantityAvailable = batch.quantityAvailable - autoGenerateCount;
      batch.productGenerationStatus = 'completed';
      await batch.save();
      
      console.log(`📈 Batch updated: ${autoGenerateCount} products generated, ${batch.quantityAvailable} remaining for manual registration`);

      // Start blockchain registration in background (non-blocking)
      console.log(`⛓️ Starting blockchain registration for ${products.length} products`);
      this.registerOnBlockchain(products).catch(error => {
        console.error('❌ Background blockchain registration error:', error);
      });

      console.log(`✅ Product generation completed successfully for batch ${batch.batchNumber}`);

    } catch (error) {
      console.error(`❌ Error generating products for batch ${batch.batchNumber}:`, error.message);
      console.error(`❌ Full error:`, error);
      
      // Reset status for retry
      try {
        batch.productGenerationStatus = 'pending';
        await batch.save();
        console.log(`🔄 Reset batch status to pending for retry`);
      } catch (saveError) {
        console.error(`❌ Failed to reset batch status:`, saveError);
      }
    } finally {
      this.processingBatches.delete(batchId);
      console.log(`🏁 Finished processing batch ${batch.batchNumber}`);
    }
  }

  async registerOnBlockchain(products) {
    console.log(`⛓️ Starting blockchain registration for ${products.length} products`);
    
    // Register products on blockchain one by one
    for (const product of products) {
      try {
        const tx = await contract.registerProduct(
          product.productName,
          product.serialNumber,
          product.batchNumber,
          Math.floor(product.manufactureDate.getTime() / 1000),
          Math.floor(product.expiryDate.getTime() / 1000),
          product.manufacturerName,
          product.dosageForm || '',
          product.strength
        );

        const receipt = await tx.wait();
        
        if (receipt.status === 1) {
          await Product.findOneAndUpdate(
            { serialNumber: product.serialNumber },
            {
              isAuthentic: true,
              txHash: receipt.hash,
              blockNumber: receipt.blockNumber,
              gasUsed: receipt.gasUsed.toString(),
              verifiedAt: new Date()
            }
          );
          
          console.log(`⛓️ Blockchain registered: ${product.serialNumber}`);
        }
        
        // Small delay to avoid overwhelming blockchain
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error(`❌ Blockchain registration failed for ${product.serialNumber}:`, error);
      }
    }
    
    console.log(`🎯 Blockchain registration process completed`);
  }

  // Manual trigger for testing
  async triggerBatchGeneration(batchNumber) {
    const batch = await Batch.findOne({ batchNumber });
    if (batch) {
      await this.generateProductsForBatch(batch);
    }
  }
}

// Create singleton instance
let serviceInstance = null;

const initProductAutoGeneration = () => {
  if (!serviceInstance) {
    serviceInstance = new ProductAutoGenerationService();
  }
  return serviceInstance;
};

// Direct function to generate products for a batch
const generateProductsForBatch = async (batch) => {
  if (!serviceInstance) {
    serviceInstance = new ProductAutoGenerationService();
  }
  return await serviceInstance.generateProductsForBatch(batch);
};

module.exports = { 
  initProductAutoGeneration, 
  generateProductsForBatch 
};