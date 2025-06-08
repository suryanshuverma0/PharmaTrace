import QRCode from 'qrcode';

export const generateQRCode = async (data) => {
  try {
    // Create the QR code data URL
    const qrDataUrl = await QRCode.toDataURL(JSON.stringify({
      serialNumber: data.serialNumber,
      batchNumber: data.batchNumber,
      productName: data.productName,
      manufacturer: data.manufacturer,
      manufactureDate: data.manufactureDate,
      expiryDate: data.expiryDate,
      regulatoryApprovalId: data.regulatoryApprovalId,
      verificationUrl: `${window.location.origin}/consumer/verify/${data.serialNumber}`
    }));
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
