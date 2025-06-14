const { ethers } = require('ethers');

const verifySignature = (address, message, signature) => {
  try {
    console.log('🔍 Verifying signature:');
    console.log('Address:', address);
    console.log('Message:', message);
    console.log('Signature:', signature);
    
    const recoveredAddress = ethers.verifyMessage(message, signature);
    console.log('Recovered Address:', recoveredAddress);
    
    const isValid = recoveredAddress.toLowerCase() === address.toLowerCase();
    console.log('Signature Valid:', isValid);
    
    return isValid;
  } catch (error) {
    console.error('❌ Signature verification error:', error);
    return false;
  }
};

module.exports = verifySignature;