import QRCode from 'qrcode';

export const generateQRCode = async (data) => {
  console.log('Generating QR code with data:', data);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

  try {
    // Parse data if it's a string, otherwise use as-is
    const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
    
    // Create comprehensive QR code data with all product information
    const qrCodeData = {
      // Basic product info
      serialNumber: parsedData.serialNumber,
      batchNumber: parsedData.batchNumber,
      productName: parsedData.productName,
      drugCode: parsedData.drugCode,
      price: parsedData.price,
      
      // Batch specifications
      dosageForm: parsedData.dosageForm,
      strength: parsedData.strength,
      storageConditions: parsedData.storageConditions,
      approvalCertId: parsedData.approvalCertId,
      productionLocation: parsedData.productionLocation,
      
      // Dates
      manufactureDate: parsedData.manufactureDate,
      expiryDate: parsedData.expiryDate,
      registrationTimestamp: parsedData.registrationTimestamp,
      
      // Blockchain data
      txHash: parsedData.txHash,
      fingerprint: parsedData.fingerprint,
      contractAddress: parsedData.contractAddress,
      productId: parsedData.productId,
      
      // Verification URL
      verificationUrl: `${API_BASE_URL}/verification/verify/${parsedData.serialNumber}`
    };

    const qrDataUrl = await QRCode.toDataURL(JSON.stringify(qrCodeData));
    return qrDataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
};

export const downloadQRCode = (dataUrl, fileName = 'qr-code.png') => {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
