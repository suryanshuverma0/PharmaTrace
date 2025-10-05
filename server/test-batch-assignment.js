const mongoose = require('mongoose');
const Batch = require('./models/Batch');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/pharma_trace', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function testBatchAssignment() {
  try {
    console.log('=== TESTING BATCH ASSIGNMENT LOGIC ===');
    
    // Find any existing batch
    const batch = await Batch.findOne();
    if (!batch) {
      console.log('No batches found in database');
      return;
    }
    
    console.log('Found batch:', {
      batchNumber: batch.batchNumber,
      quantityProduced: batch.quantityProduced,
      quantityAvailable: batch.quantityAvailable,
      quantityAssigned: batch.quantityAssigned || 0,
      quantityRemaining: batch.quantityProduced - (batch.quantityAssigned || 0)
    });
    
    // Test assignment logic
    const testQuantity = 100;
    const remainingForAssignment = batch.quantityProduced - (batch.quantityAssigned || 0);
    
    console.log(`\nTesting assignment of ${testQuantity} units:`);
    console.log(`Remaining for assignment: ${remainingForAssignment}`);
    console.log(`Can assign? ${remainingForAssignment >= testQuantity}`);
    
    // Test the virtual field
    console.log(`Virtual quantityRemainingForAssignment: ${batch.quantityRemainingForAssignment}`);
    
  } catch (error) {
    console.error('Error testing batch assignment:', error);
  } finally {
    mongoose.connection.close();
  }
}

testBatchAssignment();
