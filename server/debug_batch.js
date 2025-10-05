const mongoose = require('mongoose');
require('dotenv').config();
const Batch = require('./models/Batch');

async function debugBatch() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/pharmatrace', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Connected to MongoDB');
    
    // Find a batch that might be causing issues
    const batches = await Batch.find({}).limit(5);
    
    console.log('\n=== BATCH DEBUG INFO ===');
    batches.forEach((batch, index) => {
      console.log(`\nBatch ${index + 1}: ${batch.batchNumber}`);
      console.log('- quantityProduced:', batch.quantityProduced);
      console.log('- quantityAvailable:', batch.quantityAvailable);
      console.log('- quantityAssigned:', batch.quantityAssigned || 0);
      console.log('- quantityRemainingForAssignment:', batch.quantityRemainingForAssignment);
      console.log('- Calculated remaining:', (batch.quantityProduced - (batch.quantityAssigned || 0)));
    });
    
    // Look for a batch with 500 quantityProduced specifically
    const batch500 = await Batch.findOne({ quantityProduced: 500 });
    if (batch500) {
      console.log('\n=== BATCH WITH 500 UNITS ===');
      console.log('BatchNumber:', batch500.batchNumber);
      console.log('quantityProduced:', batch500.quantityProduced);
      console.log('quantityAvailable:', batch500.quantityAvailable);
      console.log('quantityAssigned:', batch500.quantityAssigned || 0);
      console.log('quantityRemainingForAssignment:', batch500.quantityRemainingForAssignment);
      console.log('Should allow assignment of:', (batch500.quantityProduced - (batch500.quantityAssigned || 0)));
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

debugBatch();
