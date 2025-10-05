// Test script to simulate batch assignment process
const mongoose = require('mongoose');
require('dotenv').config();
const Batch = require('./models/Batch');
const Product = require('./models/Product');
const Manufacturer = require('./models/Manufacturer');
const Distributor = require('./models/Distributor');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/pharmatrace')
  .then(() => console.log('MongoDB connected for testing'))
  .catch(err => console.error('MongoDB connection error:', err));

async function createTestData() {
  try {
    console.log('\n=== CREATING TEST DATA ===\n');
    
    // Create a test manufacturer
    const manufacturer = new Manufacturer({
      companyName: 'Test Pharma Inc',
      email: 'test@pharma.com',
      password: 'password123',
      licenseNumber: 'LIC123',
      address: 'Test Address',
      contactPerson: 'Test Person'
    });
    await manufacturer.save();
    console.log('Created manufacturer:', manufacturer.companyName);
    
    // Create a test distributor
    const distributor = new Distributor({
      companyName: 'Test Distribution Ltd',
      email: 'dist@test.com',
      password: 'password123',
      licenseNumber: 'DIST123',
      address: 'Dist Address',
      contactPerson: 'Dist Person'
    });
    await distributor.save();
    console.log('Created distributor:', distributor.companyName);
    
    // Create a test batch with 500 units
    const batch = new Batch({
      batchNumber: 'TEST-BATCH-500',
      manufacturerId: manufacturer._id,
      productName: 'Test Medicine',
      quantityProduced: 500,
      quantityAvailable: 500, // Initially all units are available for product registration
      quantityAssigned: 0,    // No units assigned yet
      manufacturingDate: new Date(),
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      description: 'Test batch for assignment testing'
    });
    await batch.save();
    console.log('Created batch:', batch.batchNumber);
    
    console.log('\n=== TEST DATA CREATED ===');
    console.log('Manufacturer ID:', manufacturer._id);
    console.log('Distributor ID:', distributor._id);
    console.log('Batch ID:', batch._id);
    console.log('Batch Quantity Produced:', batch.quantityProduced);
    console.log('Batch Quantity Available:', batch.quantityAvailable);
    console.log('Batch Quantity Assigned:', batch.quantityAssigned);
    console.log('Available for assignment:', batch.quantityProduced - (batch.quantityAssigned || 0));
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating test data:', error);
    process.exit(1);
  }
}

async function testAssignment() {
  try {
    console.log('\n=== TESTING BATCH ASSIGNMENT ===\n');
    
    // Find test batch
    const batch = await Batch.findOne({ batchNumber: 'TEST-BATCH-500' });
    if (!batch) {
      console.log('Test batch not found. Creating test data first...');
      await createTestData();
      return;
    }
    
    console.log('Found test batch:');
    console.log('Batch Number:', batch.batchNumber);
    console.log('Quantity Produced:', batch.quantityProduced);
    console.log('Quantity Available:', batch.quantityAvailable);
    console.log('Quantity Assigned:', batch.quantityAssigned || 0);
    
    // Test the assignment logic
    const requestedQuantity = 500;
    const remainingForAssignment = batch.quantityProduced - (batch.quantityAssigned || 0);
    
    console.log('\n--- Assignment Test ---');
    console.log('Requested quantity:', requestedQuantity);
    console.log('Remaining for assignment:', remainingForAssignment);
    console.log('Can assign?', remainingForAssignment >= requestedQuantity);
    
    if (remainingForAssignment < requestedQuantity) {
      console.log('ERROR: Insufficient quantity available for assignment');
      console.log('Available:', remainingForAssignment);
    } else {
      console.log('SUCCESS: Assignment should be possible');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error testing assignment:', error);
    process.exit(1);
  }
}

// Check command line arguments
const command = process.argv[2];
if (command === 'create') {
  createTestData();
} else if (command === 'test') {
  testAssignment();
} else {
  console.log('Usage:');
  console.log('  node test-assignment.js create  - Create test data');
  console.log('  node test-assignment.js test    - Test assignment logic');
  process.exit(1);
}
