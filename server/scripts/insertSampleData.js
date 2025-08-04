const mongoose = require('mongoose');
const Product = require('./models/Product');
const Batch = require('./models/Batch');
const User = require('./models/User');
const Manufacturer = require('./models/Manufacturer');
require('dotenv').config();

// Sample data for testing
const sampleData = [
  {
    product: {
      productName: "Amoxicillin 500mg Capsules",
      serialNumber: "AMX500-001",
      batchNumber: "AMX2025001",
      manufactureDate: new Date('2025-01-15'),
      expiryDate: new Date('2027-01-15'),
      dosageForm: "Capsules",
      strength: "500mg",
      packSize: "30 capsules",
      drugCode: "AMX500",
      storageCondition: "Store below 25°C",
      price: 15.99,
      manufacturerName: "PharmaCorp Inc.",
      manufacturerLicense: "FDA-MFG-12345",
      manufacturerCountry: "USA",
      productionLocation: "Boston, Massachusetts, USA",
      approvalCertId: "FDA-APP-001",
      fingerprint: "AMX500-FINGERPRINT-001",
      isAuthentic: true,
      verificationStatus: "Verified",
      regulatoryInfo: {
        licenseNumber: "NDC 12345-678-90",
        issuedBy: "FDA",
        issuedDate: new Date('2024-01-01'),
        validUntil: new Date('2029-01-01')
      },
      composition: [
        { ingredient: "Amoxicillin trihydrate", quantity: "500mg" },
        { ingredient: "Microcrystalline cellulose", quantity: "50mg" }
      ]
    },
    batch: {
      batchNumber: "AMX2025001",
      manufactureDate: new Date('2025-01-15'),
      expiryDate: new Date('2027-01-15'),
      quantityProduced: 1000,
      quantityAvailable: 750,
      dosageForm: "Capsules",
      strength: "500mg",
      storageConditions: "Store below 25°C",
      productionLocation: "Boston, Massachusetts, USA",
      approvalCertId: "FDA-APP-001",
      digitalFingerprint: "AMX500-BATCH-FINGERPRINT-001",
      txHash: "0x1234567890abcdef1234567890abcdef12345678",
      blockNumber: 12345678,
      blockHash: "0xabcdef1234567890abcdef1234567890abcdef12",
      gasUsed: "150000",
      contractAddress: "0x9876543210fedcba9876543210fedcba98765432",
      manufacturerAddress: "0xabc123def456ghi789jkl012mno345pqr678stu",
      blockchainVerified: true,
      shipmentHistory: [
        {
          timestamp: new Date('2025-01-15T08:30:00Z'),
          from: "Manufacturing",
          to: "Quality Control",
          status: "Manufactured",
          quantity: "1000",
          remarks: "Initial batch production completed",
          actor: {
            name: "PharmaCorp Manufacturing Facility",
            type: "Manufacturer",
            license: "FDA-MFG-12345",
            location: "Boston, Massachusetts, USA"
          },
          environmentalConditions: {
            temperature: "20-25°C",
            humidity: "45-65%",
            status: "Normal"
          },
          qualityCheck: {
            performedBy: "QA Team",
            date: new Date('2025-01-15'),
            result: "Pass",
            notes: "All parameters within specification"
          }
        },
        {
          timestamp: new Date('2025-01-16T14:15:00Z'),
          from: "Quality Control",
          to: "PharmaCorp Distribution Center",
          status: "In Transit",
          quantity: "1000",
          remarks: "Quality testing completed, approved for distribution",
          actor: {
            name: "PharmaCorp QC Laboratory",
            type: "Quality Control",
            license: "FDA-QC-12345",
            location: "Boston, Massachusetts, USA"
          },
          environmentalConditions: {
            temperature: "20-25°C",
            humidity: "45-65%",
            status: "Normal"
          },
          qualityCheck: {
            performedBy: "Dr. Sarah Johnson",
            date: new Date('2025-01-16'),
            result: "Pass",
            notes: "Comprehensive testing: potency, purity, dissolution, microbiology - all passed"
          }
        },
        {
          timestamp: new Date('2025-01-20T11:45:00Z'),
          from: "PharmaCorp Distribution Center",
          to: "MedLogistics Warehouse",
          status: "Distributed",
          quantity: "250",
          remarks: "Partial shipment to distributor",
          actor: {
            name: "MedLogistics Distribution Center",
            type: "Distributor",
            license: "DIST-LOG-789",
            location: "Chicago, Illinois, USA"
          },
          environmentalConditions: {
            temperature: "15-25°C",
            humidity: "40-60%",
            status: "Normal"
          }
        }
      ]
    }
  },
  {
    product: {
      productName: "Ibuprofen 200mg Tablets",
      serialNumber: "IBU200-002",
      batchNumber: "IBU2025002",
      manufactureDate: new Date('2025-02-01'),
      expiryDate: new Date('2028-02-01'),
      dosageForm: "Tablets",
      strength: "200mg",
      packSize: "50 tablets",
      drugCode: "IBU200",
      storageCondition: "Store below 30°C",
      price: 8.99,
      manufacturerName: "HealthPharm Ltd.",
      manufacturerLicense: "FDA-MFG-67890",
      manufacturerCountry: "UK",
      productionLocation: "London, United Kingdom",
      approvalCertId: "MHRA-APP-002",
      fingerprint: "IBU200-FINGERPRINT-002",
      isAuthentic: true,
      verificationStatus: "Verified",
      regulatoryInfo: {
        licenseNumber: "PL 12345/0002",
        issuedBy: "MHRA",
        issuedDate: new Date('2024-01-01'),
        validUntil: new Date('2029-01-01')
      }
    },
    batch: {
      batchNumber: "IBU2025002",
      manufactureDate: new Date('2025-02-01'),
      expiryDate: new Date('2028-02-01'),
      quantityProduced: 2000,
      quantityAvailable: 1500,
      dosageForm: "Tablets",
      strength: "200mg",
      storageConditions: "Store below 30°C",
      productionLocation: "London, United Kingdom",
      approvalCertId: "MHRA-APP-002",
      digitalFingerprint: "IBU200-BATCH-FINGERPRINT-002",
      blockchainVerified: true,
      shipmentHistory: [
        {
          timestamp: new Date('2025-02-01T09:00:00Z'),
          from: "Manufacturing",
          to: "Quality Control",
          status: "Manufactured",
          quantity: "2000",
          remarks: "Batch production completed",
          actor: {
            name: "HealthPharm Manufacturing",
            type: "Manufacturer",
            license: "FDA-MFG-67890",
            location: "London, United Kingdom"
          },
          environmentalConditions: {
            temperature: "18-22°C",
            humidity: "40-60%",
            status: "Normal"
          }
        }
      ]
    }
  }
];

async function insertSampleData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pharmatrace');
    console.log('Connected to MongoDB');

    // Create a sample manufacturer user if it doesn't exist
    let manufacturerUser = await User.findOne({ address: '0xabc123def456ghi789jkl012mno345pqr678stu' });
    if (!manufacturerUser) {
      manufacturerUser = await User.create({
        address: '0xabc123def456ghi789jkl012mno345pqr678stu',
        name: 'PharmaCorp Inc.',
        email: 'admin@pharmacorp.com',
        role: 'manufacturer',
        country: 'USA',
        state: 'Massachusetts',
        city: 'Boston',
        isApproved: true,
        isActive: true
      });
      console.log('Created manufacturer user');
    }

    // Create manufacturer profile if it doesn't exist
    let manufacturer = await Manufacturer.findOne({ user: manufacturerUser._id });
    if (!manufacturer) {
      manufacturer = await Manufacturer.create({
        user: manufacturerUser._id,
        companyName: 'PharmaCorp Inc.',
        registrationNumber: 'FDA-MFG-12345',
        certifications: ['GMP', 'ISO 9001', 'FDA Approved']
      });
      console.log('Created manufacturer profile');
    }

    // Insert sample data
    for (const data of sampleData) {
      // Check if product already exists
      const existingProduct = await Product.findOne({ serialNumber: data.product.serialNumber });
      if (!existingProduct) {
        // Create batch first
        const batch = await Batch.create({
          ...data.batch,
          manufacturerId: manufacturerUser._id,
          manufacturerAddress: manufacturerUser.address
        });
        console.log(`Created batch: ${batch.batchNumber}`);

        // Create product
        const product = await Product.create({
          ...data.product,
          batchId: batch._id,
          manufacturerId: manufacturerUser._id,
          manufacturerAddress: manufacturerUser.address
        });
        console.log(`Created product: ${product.serialNumber}`);
      } else {
        console.log(`Product ${data.product.serialNumber} already exists`);
      }
    }

    console.log('Sample data insertion completed successfully!');
    
  } catch (error) {
    console.error('Error inserting sample data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
if (require.main === module) {
  insertSampleData();
}

module.exports = { insertSampleData };
