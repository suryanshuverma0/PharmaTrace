import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Scan, Package, ArrowRight, X, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card } from "../../components/UI/Card";
import { Input } from "../../components/UI/Input";
import { Button } from "../../components/UI/Button";
import { Badge } from "../../components/UI/Badge";
import { verificationAPI } from "../../services/api/verificationAPI";
import QRScannerModal from "../../components/modals/QRScannerModal";

const VerifyDrug = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [verificationMethod, setVerificationMethod] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [serialNumber, setSerialNumber] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [error, setError] = useState(null);

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  };

  // Handle state from landing page navigation
  useEffect(() => {
    if (location.state?.serialNumber) {
      setSerialNumber(location.state.serialNumber);
      setVerificationMethod('manual');
      
      // Auto-verify if requested
      if (location.state.autoVerify) {
        performVerification(location.state.serialNumber);
      }
      
      // Clear the state to prevent re-triggering
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Handle QR scan result from modal
  const handleScanResult = (serialNum, rawData) => {
    console.log('Scanned serial number:', serialNum);
    setSerialNumber(serialNum);
    setVerificationMethod('manual');
    performVerification(serialNum);
  };





  // Perform verification with comprehensive error handling
  const performVerification = async (serialNum) => {
    setIsVerifying(true);
    setError(null);

    try {
      const result = await verificationAPI.verifyProduct(serialNum);
      
      // Validate API response structure
      if (!result || typeof result !== 'object') {
        throw new Error('Invalid response from verification service');
      }

      setVerificationResult(result);
      
    } catch (error) {
      console.error('Verification error:', error);
      
      let errorMessage = 'Failed to verify product.';
      let showNotFoundResult = false;
      
      // Handle different types of errors
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorMessage = 'Network error: Please check your internet connection and try again.';
      } else if (error.message?.includes('not found') || error.message?.includes('404')) {
        errorMessage = 'Product not found in our database.';
        showNotFoundResult = true;
      } else if (error.message?.includes('500')) {
        errorMessage = 'Server error: Please try again later.';
      } else if (error.message?.includes('401') || error.message?.includes('403')) {
        errorMessage = 'Access denied: Unable to verify product.';
      } else if (error.message?.includes('timeout')) {
        errorMessage = 'Request timeout: Please try again.';
      } else if (error.message?.includes('Invalid response')) {
        errorMessage = 'Invalid response from server. Please try again.';
      } else {
        errorMessage = error.message || 'Please check the serial number and try again.';
      }
      
      setError(errorMessage);
      
      // Show not found result structure for better UX
      if (showNotFoundResult) {
        setVerificationResult({
          success: false,
          isAuthentic: false,
          message: 'Product not found in our database',
          error: 'NOT_FOUND',
          product: {
            serialNumber: serialNum
          }
        });
      }
    } finally {
      setIsVerifying(false);
    }
  };

  // Handle manual verification with validation
  const handleVerify = async () => {
    const trimmedSerial = serialNumber.trim();
    
    // Comprehensive input validation
    if (!trimmedSerial) {
      setError('Please enter a serial number');
      return;
    }
    
    if (trimmedSerial.length < 3) {
      setError('Serial number is too short. Please enter a valid serial number.');
      return;
    }
    
    if (trimmedSerial.length > 100) {
      setError('Serial number is too long. Please check and try again.');
      return;
    }
    
    // Check for invalid characters that might indicate user error
    const invalidChars = /[<>{}[\]\\]/;
    if (invalidChars.test(trimmedSerial)) {
      setError('Serial number contains invalid characters. Please check and try again.');
      return;
    }
    
    await performVerification(trimmedSerial);
  };

  // Start QR scanning
  const startQRScanning = () => {
    setVerificationMethod("qr");
    setShowQRModal(true);
  };

  const resetVerification = () => {
    setVerificationMethod(null);
    setSerialNumber("");
    setVerificationResult(null);
    setError(null);
  };

  return (
    <motion.div
      className="flex flex-col items-center justify-center max-w-5xl min-h-screen px-6 mx-auto sm:justify-start"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header */}
      <div className="mt-32 text-center">
        <motion.h1
          className="text-2xl font-bold text-gray-900"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          Verify Your Medication
        </motion.h1>
        <motion.p
          className="mt-3 text-sm text-gray-600"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          Ensure the authenticity of your medication by scanning the QR code or
          entering the serial number
        </motion.p>
      </div>

      {!verificationResult ? (
        <div className="grid grid-cols-1 gap-8 px-5 mt-8 mb-10 md:grid-cols-2">
          {/* QR Code Scanner Option */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-gradient-to-br from-gray-50 to-white">
              <button
                onClick={startQRScanning}
                className="w-full p-3 text-left sm:p-6"
              >
                <div className="flex flex-col items-center space-y-4 text-center">
                  <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary-100">
                    <Scan className="w-8 h-8 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      Scan QR Code
                    </h3>
                    <p className="mt-2 text-gray-600">
                      Quick and easy verification using your device's camera
                    </p>
                  </div>
                </div>
              </button>
            </Card>
          </motion.div>

          {/* Manual Entry Option */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-gradient-to-br from-gray-50 to-white">
              <button
                onClick={() => setVerificationMethod("manual")}
                className="w-full p-3 text-left sm:p-6"
              >
                <div className="flex flex-col items-center space-y-4 text-center">
                  <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary-100">
                    <Package className="w-8 h-8 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      Manual Entry
                    </h3>
                    <p className="mt-2 text-gray-600">
                      Enter the serial number printed on your medication package
                    </p>
                  </div>
                </div>
              </button>
            </Card>
          </motion.div>

          {/* Manual Input Form */}
          {verificationMethod === "manual" && (
            <motion.div
              className="md:col-span-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="overflow-hidden">
                <div className="">
                  <h3 className="mb-6 text-xl font-semibold text-gray-900">
                    Enter Serial Number
                  </h3>
                  {error && (
                    <div className="p-4 mb-4 border border-red-200 rounded-lg bg-red-50">
                      <div className="flex items-start">
                        <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-red-800">Error</p>
                          <p className="mt-1 text-sm text-red-600">{error}</p>
                          
                          {/* Show helpful tips based on error type */}
                          {error.includes('Invalid QR code') && (
                            <div className="mt-2 text-xs text-red-600">
                              <p className="font-medium">QR Scanning Tips:</p>
                              <ul className="mt-1 list-disc list-inside">
                                <li>Ensure good lighting when scanning</li>
                                <li>Hold the camera steady</li>
                                <li>Make sure the entire QR code is visible</li>
                              </ul>
                            </div>
                          )}
                          
                          {error.includes('Network error') && (
                            <div className="mt-2 text-xs text-red-600">
                              <p>Please check your internet connection and try again.</p>
                            </div>
                          )}
                          
                          {error.includes('Serial number') && (
                            <div className="mt-2 text-xs text-red-600">
                              <p>Serial numbers are typically 3-50 characters long and found on the product packaging.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="flex flex-col w-full gap-4 sm:flex-row">
                    <div className="flex-grow">
                      <Input
                        placeholder="Enter product serial number"
                        value={serialNumber}
                        onChange={(e) => setSerialNumber(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleVerify()}
                        icon={<Search className="w-5 h-5" />}
                        className="w-full text-lg"
                      />
                    </div>
                    <Button
                      variant="primary"
                      onClick={handleVerify}
                      loading={isVerifying}
                      disabled={!serialNumber.trim()}
                      className="w-full h-full px-8 py-3 sm:w-auto"
                    >
                      Verify
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </div>
      ) : (
        /* Verification Result */
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="mt-4 overflow-hidden">
            <div className="p-2 pt-2 md:p-4">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    {verificationResult.isAuthentic ? (
                      <>
                        <div className="absolute inset-0 bg-green-500 rounded-full opacity-25"></div>
                        <Badge variant="success" size="lg" className="relative flex items-center">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Authentic Product
                        </Badge>
                      </>
                    ) : (
                      <>
                        <div className="absolute inset-0 bg-red-500 rounded-full opacity-25"></div>
                        <Badge variant="danger" size="lg" className="relative flex items-center">
                          <XCircle className="w-4 h-4 mr-2" />
                          {verificationResult.success === false ? 'Product Not Found' : 'Unverified Product'}
                        </Badge>
                      </>
                    )}
                  </div>
                  <p className="hidden text-gray-600 sm:block">
                    Verified on {new Date().toLocaleDateString()}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  onClick={resetVerification}
                  className="rounded-full hover:bg-gray-100"
                >
                  <X  className="w-5 h-5" />
                </Button>
              </div>
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <div className="space-y-6">
                  <div className="pb-6 border-b border-gray-100">
                    <h3 className="text-2xl font-semibold text-gray-900">
                      {verificationResult.product?.productName || 'Unknown Product'}
                    </h3>
                    <p className="mt-2 text-gray-600">
                      Manufactured by {verificationResult.manufacturer?.name || 'Unknown Manufacturer'}
                    </p>
                  </div>

                  {verificationResult.success !== false && (
                    <>
                      {/* Expiry Warning */}
                      {verificationResult.isExpired && (
                        <div className="flex items-center p-4 text-red-700 bg-red-100 border border-red-200 rounded-lg">
                          <AlertTriangle className="w-5 h-5 mr-2" />
                          <span className="text-sm font-medium">This product has expired</span>
                        </div>
                      )}
                      
                      {!verificationResult.isExpired && verificationResult.daysUntilExpiry <= 30 && (
                        <div className="flex items-center p-4 text-orange-700 bg-orange-100 border border-orange-200 rounded-lg">
                          <AlertTriangle className="w-5 h-5 mr-2" />
                          <span className="text-sm font-medium">
                            Expires in {verificationResult.daysUntilExpiry} days
                          </span>
                        </div>
                      )}

                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 rounded-lg bg-gray-50">
                            <p className="text-sm text-gray-500">Serial Number</p>
                            <p className="mt-1 font-medium text-gray-900">
                              {verificationResult.product?.serialNumber}
                            </p>
                          </div>
                          <div className="p-4 rounded-lg bg-gray-50">
                            <p className="text-sm text-gray-500">Batch Number</p>
                            <p className="mt-1 font-medium text-gray-900">
                              {verificationResult.product?.batchNumber}
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 rounded-lg bg-gray-50">
                            <p className="text-sm text-gray-500">Manufacture Date</p>
                            <p className="mt-1 font-medium text-gray-900">
                              {verificationResult.product?.manufactureDate ? 
                                new Date(verificationResult.product.manufactureDate).toLocaleDateString() : 
                                'N/A'}
                            </p>
                          </div>
                          <div className="p-4 rounded-lg bg-gray-50">
                            <p className="text-sm text-gray-500">Expiry Date</p>
                            <p className="mt-1 font-medium text-gray-900">
                              {verificationResult.product?.expiryDate ? 
                                new Date(verificationResult.product.expiryDate).toLocaleDateString() : 
                                'N/A'}
                            </p>
                          </div>
                        </div>
                        
                        {/* Additional Product Details */}
                        {(verificationResult.product?.dosageForm || verificationResult.product?.strength) && (
                          <div className="grid grid-cols-2 gap-4">
                            {verificationResult.product.dosageForm && (
                              <div className="p-4 rounded-lg bg-gray-50">
                                <p className="text-sm text-gray-500">Dosage Form</p>
                                <p className="mt-1 font-medium text-gray-900">
                                  {verificationResult.product.dosageForm}
                                </p>
                              </div>
                            )}
                            {verificationResult.product.strength && (
                              <div className="p-4 rounded-lg bg-gray-50">
                                <p className="text-sm text-gray-500">Strength</p>
                                <p className="mt-1 font-medium text-gray-900">
                                  {verificationResult.product.strength}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {/* Enhanced error messages for different scenarios */}
                  {verificationResult.success === false && (
                    <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                      <div className="flex items-start">
                        {/* <XCircle className="w-6 h-6 text-red-600 mt-0.5 mr-3 flex-shrink-0" /> */}
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-red-800">
                            {verificationResult.error === 'NOT_FOUND' ? 'Product Not Found' : 'Verification Failed'}
                          </h4>
                          <p className="mt-2 text-red-600">
                            {verificationResult.error === 'NOT_FOUND' 
                              ? `The serial number "${verificationResult.product?.serialNumber}" was not found in our database.`
                              : verificationResult.message || 'Unable to verify this product.'
                            }
                          </p>
                          
                          {/* Helpful suggestions */}
                          <div className="mt-4 text-sm text-red-600">
                            <p className="mb-2 font-medium">What you can try:</p>
                            <ul className="space-y-1 list-disc list-inside">
                              <li>Double-check the serial number for typos</li>
                              <li>Ensure you're scanning the correct QR code</li>
                              <li>Try scanning the QR code again with better lighting</li>
                              <li>Verify the product is from an authorized source</li>
                              {verificationResult.error === 'NOT_FOUND' && (
                                <li>Contact the manufacturer if you believe this is an error</li>
                              )}
                            </ul>
                          </div>

                          {/* Warning for potentially counterfeit products */}
                          {verificationResult.error === 'NOT_FOUND' && (
                            <div className="p-3 mt-4 border border-yellow-200 rounded-lg bg-yellow-50">
                              <div className="flex items-start">
                                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
                                <div className="text-sm">
                                  <p className="font-medium text-yellow-800">Important Notice</p>
                                  <p className="mt-1 text-yellow-700">
                                    Products not found in our database may be counterfeit or unauthorized. 
                                    For your safety, consult with a pharmacist before using this medication.
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  {verificationResult.success !== false && verificationResult.currentLocation && (
                    <div className="p-6 rounded-lg bg-primary-50">
                      <h4 className="text-lg font-semibold text-gray-900">
                        Current Location
                      </h4>
                      <p className="mt-2 text-gray-600">
                        {verificationResult.currentLocation.location}
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        Updated: {new Date(verificationResult.currentLocation.lastUpdated).toLocaleString()}
                      </p>
                    </div>
                  )}

                  {/* Blockchain Verification */}
                  {verificationResult.blockchain?.verified && (
                    <div className="p-6 rounded-lg bg-blue-50">
                      <h4 className="text-lg font-semibold text-gray-900">
                        Blockchain Verified
                      </h4>
                      <p className="mt-2 text-gray-600">
                        This product is verified on the blockchain
                      </p>
                      {verificationResult.blockchain.txHash && (
                        <p className="mt-1 text-xs text-blue-600 break-all">
                          TX: {verificationResult.blockchain.txHash}
                        </p>
                      )}
                    </div>
                  )}

                  {verificationResult.success !== false && (
                    <Button
                      variant="primary"
                      className="justify-center w-full py-3 text-center transition-all duration-300 shadow-lg hover:shadow-xl"
                      onClick={() =>
                        navigate(
                          `/consumer/journey/${verificationResult.product?.serialNumber}`
                        )
                      }
                    >
                      View Complete Journey
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  )}

                  {/* Action buttons for failed verifications */}
                  {verificationResult.success === false && (
                    <div className="space-y-3">
                      <Button
                        variant="primary"
                        className="justify-center w-full py-3"
                        onClick={() => {
                          setVerificationResult(null);
                          setSerialNumber('');
                          setError(null);
                        }}
                      >
                        Try Different Product
                      </Button>
                      <Button
                        variant="secondary"
                        className="justify-center w-full py-3"
                        onClick={() => {
                          setVerificationResult(null);
                          setError(null);
                          startQRScanning();
                        }}
                      >
                        <Scan className="w-5 h-5 mr-2" />
                        Scan QR Code Again
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

     

      {/* <style jsx>{`
        .scanning-line {
          position: absolute;
          width: 100%;
          height: 2px;
          background: linear-gradient(90deg, transparent, #4f46e5, transparent);
          animation: scan 2s linear infinite;
        }

        @keyframes scan {
          0% {
            top: 0;
          }
          50% {
            top: 100%;
          }
          100% {
            top: 0;
          }
        }
      `}</style> */}

       {/* QR Scanner Modal */}
      <QRScannerModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        onScanSuccess={handleScanResult}
      />
    </motion.div>
  );
};

export default VerifyDrug;
