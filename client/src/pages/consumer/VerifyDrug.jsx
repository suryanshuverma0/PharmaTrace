import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Scan, Package, ArrowRight, X, AlertTriangle, CheckCircle, XCircle, Camera } from "lucide-react";
import { useNavigate } from "react-router-dom";
import QrScanner from 'qr-scanner';
import { Card } from "../../components/UI/Card";
import { Input } from "../../components/UI/Input";
import { Button } from "../../components/UI/Button";
import { Modal } from "../../components/UI/Modal";
import { Badge } from "../../components/UI/Badge";
import { verificationAPI } from "../../services/api/verificationAPI";

const VerifyDrug = () => {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const qrScannerRef = useRef(null);
  const [verificationMethod, setVerificationMethod] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const [serialNumber, setSerialNumber] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [error, setError] = useState(null);
  const [scannerError, setScannerError] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [availableCameras, setAvailableCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

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

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent) ||
                           ('ontouchstart' in window) ||
                           (navigator.maxTouchPoints && navigator.maxTouchPoints > 2);
      setIsMobile(isMobileDevice);
    };
    
    checkMobile();
  }, []);

  // Get available cameras
  const getAvailableCameras = async () => {
    try {
      const cameras = await QrScanner.listCameras(true);
      console.log('Available cameras:', cameras);
      setAvailableCameras(cameras);
      
      // For mobile devices, prefer back camera
      if (isMobile && cameras.length > 0) {
        // Look for back/environment camera
        const backCamera = cameras.find(camera => 
          camera.label.toLowerCase().includes('back') ||
          camera.label.toLowerCase().includes('rear') ||
          camera.label.toLowerCase().includes('environment') ||
          camera.id.includes('environment')
        );
        
        if (backCamera) {
          setSelectedCamera(backCamera.id);
          console.log('Selected back camera:', backCamera.label);
        } else {
          // Fallback to first available camera
          setSelectedCamera(cameras[0].id);
          console.log('Selected default camera:', cameras[0].label);
        }
      } else if (cameras.length > 0) {
        // For desktop, use first available camera
        setSelectedCamera(cameras[0].id);
      }
    } catch (error) {
      console.error('Failed to get cameras:', error);
      setScannerError('Failed to access camera devices');
    }
  };

  // Initialize QR Scanner with mobile optimization
  const initializeScanner = async () => {
    if (!videoRef.current) return;

    try {
      setScannerError(null);
      setIsScanning(true);

      // Stop existing scanner if any
      if (qrScannerRef.current) {
        qrScannerRef.current.stop();
        qrScannerRef.current.destroy();
      }

      // Get available cameras first
      await getAvailableCameras();

      // Create new QR scanner with mobile-optimized settings
      qrScannerRef.current = new QrScanner(
        videoRef.current,
        (result) => {
          console.log('QR Code detected:', result.data);
          handleQRResult(result.data);
        },
        {
          returnDetailedScanResult: true,
          highlightScanRegion: true,
          highlightCodeOutline: true,
          // Mobile optimizations
          preferredCamera: selectedCamera || (isMobile ? 'environment' : 'user'),
          maxScansPerSecond: isMobile ? 5 : 10, // Lower scan rate for mobile to save battery
          calculateScanRegion: (video) => {
            // Custom scan region for mobile - center square
            if (isMobile) {
              const smallerDimension = Math.min(video.videoWidth, video.videoHeight);
              const scanSize = smallerDimension * 0.8;
              return {
                x: (video.videoWidth - scanSize) / 2,
                y: (video.videoHeight - scanSize) / 2,
                width: scanSize,
                height: scanSize,
              };
            }
            return null; // Use default for desktop
          }
        }
      );

      // Set camera if available
      if (selectedCamera && availableCameras.length > 0) {
        await qrScannerRef.current.setCamera(selectedCamera);
      }

      await qrScannerRef.current.start();
    } catch (error) {
      console.error('Failed to start QR scanner:', error);
      let errorMessage = 'Failed to access camera. ';
      
      if (error.name === 'NotAllowedError') {
        errorMessage += 'Please allow camera permissions and try again.';
      } else if (error.name === 'NotFoundError') {
        errorMessage += 'No camera found on this device.';
      } else if (error.name === 'NotSupportedError') {
        errorMessage += 'Camera not supported in this browser.';
      } else {
        errorMessage += 'Please check camera permissions and try again.';
      }
      
      setScannerError(errorMessage);
      setIsScanning(false);
    }
  };

  // Stop QR Scanner
  const stopScanner = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      qrScannerRef.current.destroy();
      qrScannerRef.current = null;
    }
    setIsScanning(false);
    setScannerError(null);
  };

  // Switch camera (for devices with multiple cameras)
  const switchCamera = async () => {
    if (!qrScannerRef.current || availableCameras.length <= 1) return;

    try {
      const currentIndex = availableCameras.findIndex(camera => camera.id === selectedCamera);
      const nextIndex = (currentIndex + 1) % availableCameras.length;
      const nextCamera = availableCameras[nextIndex];
      
      setSelectedCamera(nextCamera.id);
      await qrScannerRef.current.setCamera(nextCamera.id);
      
      console.log('Switched to camera:', nextCamera.label);
    } catch (error) {
      console.error('Failed to switch camera:', error);
      setScannerError('Failed to switch camera');
    }
  };

  // Handle QR scan result with comprehensive error handling
  const handleQRResult = async (qrData) => {
    try {
      console.log('Raw QR data:', qrData);
      
      // Validate QR data is not empty or just whitespace
      if (!qrData || typeof qrData !== 'string' || qrData.trim().length === 0) {
        setError('Invalid QR code: No data found');
        return;
      }

      // Provide haptic feedback on mobile
      if (isMobile && 'vibrate' in navigator) {
        navigator.vibrate(200);
      }
      
      // Stop scanner immediately when QR is detected
      stopScanner();
      setShowScanner(false);
      
      let serialNum = '';
      let qrType = 'unknown';
      
      // Try to parse as JSON first
      try {
        const parsedData = JSON.parse(qrData);
        console.log('Parsed QR data:', parsedData);
        qrType = 'json';
        
        // Validate JSON structure
        if (typeof parsedData !== 'object' || parsedData === null) {
          throw new Error('Invalid JSON structure in QR code');
        }
        
        // Extract serial number from various possible fields
        serialNum = parsedData.serialNumber || parsedData.productId || parsedData.id;
        
        // If still no serial number, check if there's a verification URL
        if (!serialNum && parsedData.verificationUrl) {
          const urlMatch = parsedData.verificationUrl.match(/\/verify\/([^/?]+)/);
          if (urlMatch && urlMatch[1] !== 'undefined') {
            serialNum = urlMatch[1];
          }
        }
        
        // Additional validation for expected QR format
        if (!serialNum && !parsedData.verificationUrl) {
          throw new Error('QR code does not contain required product information');
        }
        
      } catch (jsonError) {
        console.log('Not JSON format, trying other formats...');
        
        // If not JSON, check if it's a URL or plain text
        if (qrData.includes('verify/') || qrData.includes('verification/')) {
          qrType = 'url';
          const urlMatch = qrData.match(/\/verify(?:ication)?\/([^/?]+)/);
          if (urlMatch && urlMatch[1] !== 'undefined') {
            serialNum = urlMatch[1];
          }
        } else if (qrData.length >= 3 && qrData.length <= 100) {
          // Accept as plain serial number if reasonable length
          qrType = 'plain';
          serialNum = qrData.trim();
        } else {
          // Invalid format
          setError(`Invalid QR code format. Expected product QR code, but found: ${qrData.length > 50 ? qrData.substring(0, 50) + '...' : qrData}`);
          return;
        }
      }

      console.log('Extracted serial number:', serialNum, 'Type:', qrType);

      // Validate serial number
      if (!serialNum || serialNum === 'undefined' || serialNum === 'null') {
        setError('Invalid QR code: No valid serial number found. Please ensure you\'re scanning a product verification QR code.');
        return;
      }

      // Additional validation for serial number format
      if (serialNum.length < 3) {
        setError('Invalid serial number: Too short. Please check the QR code.');
        return;
      }

      if (serialNum.length > 100) {
        setError('Invalid serial number: Too long. Please check the QR code.');
        return;
      }

      // Check for suspicious characters that might indicate corrupted QR
      const suspiciousPattern = /[<>{}[\]\\]/;
      if (suspiciousPattern.test(serialNum)) {
        setError('Invalid serial number format. Please try scanning again.');
        return;
      }

      setSerialNumber(serialNum);
      await performVerification(serialNum);

    } catch (error) {
      console.error('Error processing QR result:', error);
      setError(`Failed to process QR code: ${error.message || 'Unknown error occurred'}`);
      
      // Restore scanner if needed for retry
      setTimeout(() => {
        if (!showScanner) {
          setShowScanner(false);
        }
      }, 100);
    }
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

  // Start QR scanning with mobile optimization
  const startQRScanning = async () => {
    setVerificationMethod("qr");
    setShowScanner(true);
    
    // Prevent body scroll on mobile when modal is open
    if (isMobile) {
      document.body.style.overflow = 'hidden';
    }
    
    // Small delay to ensure modal is rendered
    setTimeout(() => {
      initializeScanner();
    }, 100);
  };

  // Close scanner modal
  const closeScannerModal = () => {
    stopScanner();
    setShowScanner(false);
    
    // Restore body scroll on mobile
    if (isMobile) {
      document.body.style.overflow = 'auto';
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanner();
      // Restore body scroll in case component unmounts while modal is open
      if (isMobile) {
        document.body.style.overflow = 'auto';
      }
    };
  }, [isMobile]);

  const resetVerification = () => {
    setVerificationMethod(null);
    setSerialNumber("");
    setVerificationResult(null);
    setError(null);
    setScannerError(null);
    stopScanner();
  };

  return (
    <motion.div
      className="max-w-5xl min-h-screen mx-auto"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header */}
      <div className="text-center">
        <motion.h1
          className="text-3xl font-bold text-gray-900"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          Verify Your Medication
        </motion.h1>
        <motion.p
          className="mt-3 text-lg text-gray-600"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          Ensure the authenticity of your medication by scanning the QR code or
          entering the serial number
        </motion.p>
      </div>

      {!verificationResult ? (
        <div className="grid grid-cols-1 gap-8 mt-8 md:grid-cols-2">
          {/* QR Code Scanner Option */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-gradient-to-br from-gray-50 to-white">
              <button
                onClick={startQRScanning}
                className="w-full p-8 text-left"
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
                className="w-full p-8 text-left"
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
                <div className="p-8 bg-gradient-to-br from-primary-50 to-white">
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
          <Card className="overflow-hidden">
            <div className="p-8">
              <div className="flex items-start justify-between mb-8">
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
                  <p className="text-gray-600">
                    Verified on {new Date().toLocaleDateString()}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  onClick={resetVerification}
                  className="rounded-full hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
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
                    <div className="p-6 border border-red-200 rounded-lg bg-red-50">
                      <div className="flex items-start">
                        <XCircle className="w-6 h-6 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
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
      )}      {/* QR Scanner Modal */}
      <Modal
        isOpen={showScanner}
        onClose={closeScannerModal}
        title="Scan QR Code"
      >
        <div className="p-4 sm:p-6">
          <div className="flex flex-col items-center space-y-6">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary-100">
              <Scan className="w-6 h-6 text-primary-600" />
            </div>
            
            <p className="text-sm text-center text-gray-600 sm:text-base">
              {isScanning ? 'Position the QR code within the frame' : 'Preparing camera...'}
            </p>

            <div className="relative w-full max-w-[280px] sm:max-w-[300px] mx-auto aspect-square">
              {/* Video Element for QR Scanner */}
              <video
                ref={videoRef}
                className="absolute inset-0 object-cover w-full h-full bg-black rounded-2xl"
                muted
                playsInline
                style={{ 
                  transform: isMobile ? 'scaleX(-1)' : 'none' // Mirror for mobile front camera
                }}
              />

              {/* Camera Switch Button (for mobile with multiple cameras) */}
              {isMobile && availableCameras.length > 1 && isScanning && (
                <button
                  onClick={switchCamera}
                  className="absolute z-10 p-2 text-white transition-colors rounded-full bg-black/50 top-4 right-4 hover:bg-black/70"
                  title="Switch Camera"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              )}

              {/* Scan Region Indicator for Mobile */}
              {isMobile && isScanning && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-48 border-2 border-white border-dashed rounded-lg opacity-50"></div>
                </div>
              )}

              {/* Overlay and Corner Markers */}
              <div className="absolute inset-0 rounded-2xl">
                {/* Corner Markers */}
                <div className="absolute w-6 h-6 border-t-4 border-l-4 border-white shadow-lg top-4 left-4"></div>
                <div className="absolute w-6 h-6 border-t-4 border-r-4 border-white shadow-lg top-4 right-4"></div>
                <div className="absolute w-6 h-6 border-b-4 border-l-4 border-white shadow-lg bottom-4 left-4"></div>
                <div className="absolute w-6 h-6 border-b-4 border-r-4 border-white shadow-lg bottom-4 right-4"></div>

                {/* Status Indicator */}
                <div className="absolute inset-x-0 bottom-0 p-4 text-center bg-gradient-to-t from-black/60 to-transparent rounded-b-2xl">
                  <p className="text-sm font-medium text-white">
                    {isScanning ? 
                      (isMobile ? 'Hold steady and scan QR code' : 'Scanning for QR codes...') : 
                      'Initializing camera...'}
                  </p>
                  {/* Camera info for debugging */}
                  {isScanning && selectedCamera && availableCameras.length > 0 && (
                    <p className="mt-1 text-xs text-white/75">
                      {availableCameras.find(c => c.id === selectedCamera)?.label || 'Camera active'}
                      {isMobile && availableCameras.length > 1 && ' • Tap to switch'}
                    </p>
                  )}
                </div>

                {/* Loading indicator when not scanning */}
                {!isScanning && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl">
                    <div className="flex flex-col items-center space-y-3">
                      <Camera className="w-8 h-8 text-white animate-pulse" />
                      <p className="text-sm text-white">
                        {isMobile ? 'Starting camera...' : 'Accessing camera...'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Error message */}
            {scannerError && (
              <div className="flex items-start p-3 text-red-700 bg-red-100 border border-red-200 rounded-lg">
                <AlertTriangle className="flex-shrink-0 w-5 h-5 mt-0.5 mr-2" />
                <div className="text-sm">
                  <p className="font-medium">{scannerError}</p>
                  {isMobile && (
                    <p className="mt-1 text-red-600">
                      Try refreshing the page or switching to manual entry if camera issues persist.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Mobile-specific tips */}
            {isMobile && isScanning && !scannerError && (
              <div className="p-3 text-blue-700 bg-blue-100 border border-blue-200 rounded-lg">
                <div className="text-sm">
                  <p className="font-medium">Mobile scanning tips:</p>
                  <ul className="mt-1 ml-4 list-disc">
                    <li>Hold phone steady and ensure good lighting</li>
                    <li>Position QR code within the dashed square</li>
                    {availableCameras.length > 1 && <li>Tap the switch button to change camera</li>}
                  </ul>
                </div>
              </div>
            )}

            <div className="flex flex-col justify-center w-full gap-3 sm:flex-row">
              <Button
                variant="secondary"
                onClick={closeScannerModal}
                className="w-full px-6 sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  closeScannerModal();
                  setVerificationMethod("manual");
                }}
                className="w-full px-6 sm:w-auto"
              >
                Manual Entry Instead
              </Button>
            </div>
          </div>
        </div>
      </Modal>

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
    </motion.div>
  );
};

export default VerifyDrug;
