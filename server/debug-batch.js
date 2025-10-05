const mongoose = require('mongoose');
require('dotenv').config();
const Batch = require('./models/Batch');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/pharmatrace')
  .then(() => console.log('MongoDB connected for debugging'))
  .catch(err => console.error('MongoDB connection error:', err));

async function debugBatch() {
  try {
    console.log('\n=== BATCH DEBUG ANALYSIS ===\n');
    
    // Get all batches to see the current state
    const batches = await Batch.find({}).limit(5);
    
    console.log(`Found ${batches.length} batches in database:`);
    
    batches.forEach((batch, index) => {
      console.log(`\n--- Batch ${index + 1} ---`);
      console.log(`Batch Number: ${batch.batchNumber}`);
      console.log(`Quantity Produced: ${batch.quantityProduced}`);
      console.log(`Quantity Available: ${batch.quantityAvailable}`);
      console.log(`Quantity Assigned: ${batch.quantityAssigned || 0}`);
      console.log(`Quantity Remaining (virtual): ${batch.quantityRemaining}`);
      console.log(`Quantity Remaining for Assignment (virtual): ${batch.quantityRemainingForAssignment}`);
      
      // Calculate manually
      const manualCalculation = batch.quantityProduced - (batch.quantityAssigned || 0);
      console.log(`Manual Calculation (quantityProduced - quantityAssigned): ${manualCalculation}`);
    });
    
    // Check if there are any batches with 500 units
    const batch500 = await Batch.findOne({ quantityProduced: 500 });
    if (batch500) {
      console.log('\n=== BATCH WITH 500 UNITS ===');
      console.log('Batch Number:', batch500.batchNumber);
      console.log('Quantity Produced:', batch500.quantityProduced);
      console.log('Quantity Available:', batch500.quantityAvailable);
      console.log('Quantity Assigned:', batch500.quantityAssigned || 0);
      console.log('Assignments array:', batch500.assignments);
      
      const shouldBeAvailable = batch500.quantityProduced - (batch500.quantityAssigned || 0);
      console.log('Should be available for assignment:', shouldBeAvailable);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error debugging batch:', error);
    process.exit(1);
  }
}

debugBatch();
