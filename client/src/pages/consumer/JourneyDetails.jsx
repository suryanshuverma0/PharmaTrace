import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  Calendar,
  MapPin,
  Check,
  Shield,
  Building2,
  Truck,
  Store,
  Clipboard,
  Download,
  Save,
  Share2,
  AlertTriangle,
  Printer,
  Clock,
  CheckCircle,
  ExternalLink,
  Eye,
  Package
} from 'lucide-react';
import { verificationAPI } from '../../services/api/verificationAPI';

const JourneyDetails = () => {
  const { serialNumber } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [drugData, setDrugData] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchJourneyData = async () => {
      if (!serialNumber) {
        setError('Serial number is required');
        setLoading(false);
        return;
      }

      try {
        const result = await verificationAPI.getProductJourney(serialNumber);
        setDrugData(result);
        setActiveStep(result.journey ? result.journey.length - 1 : 0);
      } catch (error) {
        console.error('Error fetching journey data:', error);
        setError(error.message || 'Failed to load journey details');
      } finally {
        setLoading(false);
      }
    };

    fetchJourneyData();
  }, [serialNumber]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
              <p className="text-gray-600">Loading journey details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-500" />
              <h2 className="mb-2 text-xl font-semibold text-gray-900">Unable to Load Journey</h2>
              <p className="mb-4 text-gray-600">{error}</p>
              <button
                onClick={() => navigate('/consumer/verify')}
                className="px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600"
              >
                Back to Verification
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-emerald-600 bg-emerald-100';
      case 'in_progress': return 'text-blue-600 bg-blue-100';
      case 'pending': return 'text-amber-600 bg-amber-100';
      case 'failed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getIconComponent = (iconName) => {
    const iconMap = {
      'Building2': Building2,
      'Clipboard': Clipboard,
      'Truck': Truck,
      'Store': Store,
      'Package': Package,
    };
    return iconMap[iconName] || Package;
  };

  const getDaysUntilExpiry = () => {
    if (!drugData?.product?.expiryDate) return null;
    const today = new Date();
    const expiry = new Date(drugData.product.expiryDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntilExpiry = getDaysUntilExpiry();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen pt-20 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 print-container">
      {/* Print Styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            /* Hide non-essential elements */
            .no-print {
              display: none !important;
            }
            
            /* Page setup */
            @page {
              size: A4;
              margin: 1.5cm;
            }
            
            /* Body and container styles */
            body {
              font-family: 'Times New Roman', serif !important;
              line-height: 1.4 !important;
              color: #000 !important;
              background: white !important;
            }
            
            .print-container {
              background: white !important;
              box-shadow: none !important;
              border-radius: 0 !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            
            /* Header styling */
            .print-header {
              border-bottom: 2px solid #000;
              margin-bottom: 20px;
              padding-bottom: 15px;
            }
            
            .print-title {
              font-size: 24px !important;
              font-weight: bold !important;
              text-align: center;
              margin-bottom: 10px;
              color: #000 !important;
            }
            
            .print-subtitle {
              font-size: 16px !important;
              text-align: center;
              color: #666 !important;
              margin-bottom: 5px;
            }
            
            /* Product info styling */
            .print-product-info {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin-bottom: 25px;
              padding: 15px;
              border: 1px solid #ddd;
            }
            
            .print-info-item {
              margin-bottom: 8px;
            }
            
            .print-info-label {
              font-weight: bold;
              color: #333;
              font-size: 12px;
            }
            
            .print-info-value {
              color: #000;
              font-size: 12px;
              margin-top: 2px;
            }
            
            /* Journey timeline styling */
            .print-journey {
              margin-top: 25px;
            }
            
            .print-journey-title {
              font-size: 18px !important;
              font-weight: bold !important;
              border-bottom: 1px solid #ccc;
              padding-bottom: 8px;
              margin-bottom: 15px;
              color: #000 !important;
            }
            
            .print-step {
              margin-bottom: 20px;
              border-left: 3px solid #007bff;
              padding-left: 15px;
              page-break-inside: avoid;
            }
            
            .print-step-header {
              font-weight: bold;
              font-size: 14px;
              margin-bottom: 5px;
              color: #000;
            }
            
            .print-step-meta {
              font-size: 11px;
              color: #666;
              margin-bottom: 8px;
            }
            
            .print-step-details {
              font-size: 12px;
              color: #333;
              margin-bottom: 10px;
              line-height: 1.4;
            }
            
            .print-step-extras {
              background: #f8f9fa !important;
              padding: 8px;
              border: 1px solid #e9ecef;
              font-size: 10px;
              color: #495057;
            }
            
            /* Authentication status */
            .print-auth-verified {
              background: #d4edda !important;
              color: #155724 !important;
              padding: 8px 12px;
              border: 1px solid #c3e6cb;
              border-radius: 4px;
              font-weight: bold;
              text-align: center;
              margin-bottom: 15px;
            }
            
            .print-auth-unverified {
              background: #f8d7da !important;
              color: #721c24 !important;
              padding: 8px 12px;
              border: 1px solid #f5c6cb;
              border-radius: 4px;
              font-weight: bold;
              text-align: center;
              margin-bottom: 15px;
            }
            
            /* Footer */
            .print-footer {
              margin-top: 30px;
              padding-top: 15px;
              border-top: 1px solid #ccc;
              font-size: 10px;
              color: #666;
              text-align: center;
            }
            
            /* Blockchain verification */
            .print-blockchain {
              background: #e8f5e8 !important;
              border: 1px solid #c3e6cb;
              padding: 10px;
              margin: 15px 0;
            }
            
            .print-blockchain-title {
              font-weight: bold;
              color: #155724;
              margin-bottom: 5px;
            }
            
            /* Page breaks */
            .print-page-break {
              page-break-before: always;
            }
            
            /* Grid layouts for print */
            .print-grid-2 {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 15px;
            }
            
            .print-grid-3 {
              display: grid;
              grid-template-columns: 1fr 1fr 1fr;
              gap: 10px;
            }
          }
        `
      }} />
      
      {/* Header */}
      <div className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur-md border-gray-200/50 no-print">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => navigate('/consumer/verify')}
                className="flex items-center px-3 py-2 text-gray-600 transition-colors rounded-lg hover:text-gray-900 hover:bg-gray-100"
              >
                <ChevronLeft className="w-5 h-5 mr-1" />
                Back to Verification
              </button>
              <div className="w-px h-6 bg-gray-300"></div>
              <div className="flex items-center space-x-2">
                <Package className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-gray-900">Product Journey</span>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button 
                onClick={handlePrint}
                className="flex items-center px-3 py-2 text-gray-600 transition-colors rounded-lg hover:text-gray-900 hover:bg-gray-100"
              >
                <Printer className="w-4 h-4 mr-2" />
                Print Report
              </button>
              <button className="p-2 text-gray-600 transition-colors rounded-lg hover:text-gray-900 hover:bg-gray-100">
                <Share2 className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-600 transition-colors rounded-lg hover:text-gray-900 hover:bg-gray-100">
                <Eye className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
        {/* Status Banner */}
        <div className="mb-8">
          {/* Print Header - Only visible in print */}
          <div className="hidden mb-6 print:block print-header">
            <div className="print-title">PHARMACEUTICAL PRODUCT VERIFICATION REPORT</div>
            <div className="print-subtitle">Supply Chain Journey & Authentication Details</div>
            <div className="print-subtitle">Generated on: {new Date().toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</div>
          </div>

          {/* Screen Banner */}
          <div className="p-6 text-white shadow-lg bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl print:hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl">
                  <Shield className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="mb-1 text-2xl font-bold">{drugData?.product?.productName || 'Unknown Product'}</h1>
                  <p className="text-emerald-100">Serial: {drugData?.product?.serialNumber}</p>
                  <p className="text-blue-100">Batch: {drugData?.product?.batchNumber}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center mb-2 space-x-2">
                  {drugData?.product?.isAuthentic ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-emerald-200" />
                      <span className="font-medium">Verified Authentic</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-5 h-5 text-yellow-200" />
                      <span className="font-medium">Unverified Product</span>
                    </>
                  )}
                </div>
                {daysUntilExpiry !== null && (
                  <p className="text-sm text-blue-100">
                    {daysUntilExpiry > 0 ? `Expires in ${daysUntilExpiry} days` : 'Expired'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Print Authentication Status */}
          <div className="hidden print:block">
            <div className={drugData?.product?.isAuthentic ? 'print-auth-verified' : 'print-auth-unverified'}>
              {drugData?.product?.isAuthentic ? '✓ VERIFIED AUTHENTIC PRODUCT' : '⚠ UNVERIFIED PRODUCT'}
            </div>
          </div>
        </div>
        {/* Main Content */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Product Info Card */}
          <div className="space-y-6 lg:col-span-1">
            <div className="overflow-hidden bg-white shadow-lg rounded-2xl print:shadow-none print:border print:border-gray-300">
              <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white print:bg-white print:border-b-2 print:border-black">
                <h2 className="flex items-center text-lg font-semibold text-gray-900 print:text-black print:text-base">
                  <Package className="w-5 h-5 mr-2 text-blue-600 print:hidden" />
                  Product Information
                </h2>
              </div>
              <div className="p-6 space-y-4 print:print-product-info print:space-y-0">
                <div className="print:print-info-item">
                  <p className="text-sm font-medium text-gray-500 print:print-info-label">Product Name</p>
                  <p className="mt-1 text-gray-900 print:print-info-value">{drugData?.product?.productName || 'N/A'}</p>
                </div>
                <div className="print:print-info-item">
                  <p className="text-sm font-medium text-gray-500 print:print-info-label">Manufacturer</p>
                  <p className="mt-1 text-gray-900 print:print-info-value">{drugData?.product?.manufacturer || 'N/A'}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 print:contents">
                  <div className="print:print-info-item">
                    <p className="text-sm font-medium text-gray-500 print:print-info-label">Dosage Form</p>
                    <p className="mt-1 text-gray-900 print:print-info-value">{drugData?.product?.dosageForm || 'N/A'}</p>
                  </div>
                  <div className="print:print-info-item">
                    <p className="text-sm font-medium text-gray-500 print:print-info-label">Strength</p>
                    <p className="mt-1 text-gray-900 print:print-info-value">{drugData?.product?.strength || 'N/A'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 print:contents">
                  <div className="print:print-info-item">
                    <p className="text-sm font-medium text-gray-500 print:print-info-label">Manufacture Date</p>
                    <p className="mt-1 text-gray-900 print:print-info-value">
                      {drugData?.product?.manufactureDate ? 
                        new Date(drugData.product.manufactureDate).toLocaleDateString() : 
                        'N/A'}
                    </p>
                  </div>
                  <div className="print:print-info-item">
                    <p className="text-sm font-medium text-gray-500 print:print-info-label">Expiry Date</p>
                    <p className="mt-1 text-gray-900 print:print-info-value">
                      {drugData?.product?.expiryDate ? 
                        new Date(drugData.product.expiryDate).toLocaleDateString() : 
                        'N/A'}
                    </p>
                  </div>
                </div>
                {drugData?.product?.packSize && (
                  <div className="print:print-info-item">
                    <p className="text-sm font-medium text-gray-500 print:print-info-label">Pack Size</p>
                    <p className="mt-1 text-gray-900 print:print-info-value">{drugData.product.packSize}</p>
                  </div>
                )}
                {drugData?.product?.regulatoryInfo && (
                  <div className="print:print-info-item">
                    <p className="text-sm font-medium text-gray-500 print:print-info-label">Regulatory Info</p>
                    <p className="mt-1 text-gray-900 print:print-info-value">{drugData.product.regulatoryInfo}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Blockchain Verification */}
            {drugData?.blockchain?.verified && (
              <div className="overflow-hidden bg-white shadow-lg rounded-2xl print:print-blockchain print:shadow-none">
                <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-green-50 to-white print:bg-transparent print:border-none print:p-0 print:mb-2">
                  <h3 className="flex items-center text-lg font-semibold text-gray-900 print:print-blockchain-title print:text-base">
                    <Shield className="w-5 h-5 mr-2 text-green-600 print:hidden" />
                    Blockchain Verification
                  </h3>
                </div>
                <div className="p-6 space-y-4 print:p-0 print:space-y-2">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600 print:hidden" />
                    <span className="font-medium text-green-800 print:text-green-700 print:text-sm">Verified on Blockchain</span>
                  </div>
                  {drugData.blockchain.txHash && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 print:text-xs print:text-gray-700">Transaction Hash</p>
                      <p className="mt-1 text-xs text-gray-600 break-all print:text-black">{drugData.blockchain.txHash}</p>
                    </div>
                  )}
                  {drugData.blockchain.blockNumber && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 print:text-xs print:text-gray-700">Block Number</p>
                      <p className="mt-1 text-gray-900 print:text-black print:text-xs">{drugData.blockchain.blockNumber}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Journey Timeline */}
          <div className="lg:col-span-2">
            <div className="overflow-hidden bg-white shadow-lg rounded-2xl print:shadow-none print:border print:border-gray-300">
              <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white print:bg-white print:border-b-2 print:border-black">
                <h2 className="flex items-center text-xl font-semibold text-gray-900 print:print-journey-title">
                  <MapPin className="w-6 h-6 mr-2 text-blue-600 print:hidden" />
                  Supply Chain Journey
                </h2>
                <p className="mt-1 text-gray-600 print:text-xs print:text-gray-700">Track your medication from manufacturing to delivery</p>
              </div>

              <div className="p-6 print:print-journey">
                {drugData?.journey && drugData.journey.length > 0 ? (
                  <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-8 top-0 w-0.5 h-full bg-gray-200 print:hidden"></div>
                    
                    <div className="space-y-8 print:space-y-4">
                      {drugData.journey.map((step, index) => {
                        const IconComponent = getIconComponent(step.icon);
                        const isActive = index === activeStep;
                        const isCompleted = step.status === 'completed';
                        
                        return (
                          <div
                            key={index}
                            className={`relative flex items-start space-x-4 print:print-step ${
                              isActive ? 'opacity-100' : 'opacity-75'
                            }`}
                          >
                            {/* Icon */}
                            <div className={`relative z-10 flex items-center justify-center w-16 h-16 rounded-full border-4 print:hidden ${
                              isCompleted 
                                ? 'bg-green-100 border-green-200 text-green-600' 
                                : step.status === 'in_progress'
                                ? 'bg-blue-100 border-blue-200 text-blue-600'
                                : 'bg-gray-100 border-gray-200 text-gray-500'
                            }`}>
                              <IconComponent className="w-6 h-6" />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-2 print:block">
                                <h3 className="text-lg font-semibold text-gray-900 print:print-step-header">{step.step}</h3>
                                <div className={`px-3 py-1 rounded-full text-xs font-medium print:hidden ${getStatusColor(step.status)}`}>
                                  {step.status === 'completed' ? 'Completed' : 
                                   step.status === 'in_progress' ? 'In Progress' : 
                                   'Pending'}
                                </div>
                              </div>
                              
                              <div className="grid gap-4 mb-4 md:grid-cols-2 print:print-step-meta print:grid-cols-1 print:gap-1 print:mb-2">
                                <div className="flex items-center space-x-2 text-sm text-gray-600 print:text-xs">
                                  <Calendar className="w-4 h-4 print:hidden" />
                                  <span>📅 {step.date} at {step.time}</span>
                                </div>
                                <div className="flex items-center space-x-2 text-sm text-gray-600 print:text-xs">
                                  <MapPin className="w-4 h-4 print:hidden" />
                                  <span>📍 {step.location}</span>
                                </div>
                              </div>

                              <div className="mb-4 print:mb-2">
                                <p className="mb-1 text-sm font-medium text-gray-700 print:text-xs print:mb-0">Handled by</p>
                                <p className="text-gray-600 print:text-xs print:text-black">{step.actor}</p>
                              </div>

                              <p className="mb-4 text-gray-700 print:print-step-details print:mb-2">{step.details}</p>

                              {/* Additional Details */}
                              <div className="grid gap-4 p-4 rounded-lg bg-gray-50 md:grid-cols-3 print:print-step-extras print:grid-cols-2 print:gap-2 print:p-2">
                                {step.temperature && (
                                  <div className="flex items-center space-x-2 text-sm print:text-xs">
                                    <AlertTriangle className="w-4 h-4 text-blue-500 print:hidden" />
                                    <span className="text-gray-600 print:text-gray-700">🌡️ Temp: {step.temperature}</span>
                                  </div>
                                )}
                                {step.humidity && (
                                  <div className="flex items-center space-x-2 text-sm print:text-xs">
                                    <Clock className="w-4 h-4 text-blue-500 print:hidden" />
                                    <span className="text-gray-600 print:text-gray-700">💧 Humidity: {step.humidity}</span>
                                  </div>
                                )}
                                {step.quantity && (
                                  <div className="flex items-center space-x-2 text-sm print:text-xs">
                                    <Package className="w-4 h-4 text-blue-500 print:hidden" />
                                    <span className="text-gray-600 print:text-gray-700">📦 Qty: {step.quantity}</span>
                                  </div>
                                )}
                                {step.verified && (
                                  <div className="flex items-center space-x-2 text-sm print:text-xs">
                                    <CheckCircle className="w-4 h-4 text-green-500 print:hidden" />
                                    <span className="text-green-600 print:text-green-700">✅ Verified</span>
                                  </div>
                                )}
                                {step.license && (
                                  <div className="flex items-center space-x-2 text-sm print:text-xs">
                                    <Shield className="w-4 h-4 text-blue-500 print:hidden" />
                                    <span className="text-gray-600 print:text-gray-700">🏛️ License: {step.license}</span>
                                  </div>
                                )}
                                {step.qualityCheck && (
                                  <div className="flex items-center space-x-2 text-sm print:text-xs">
                                    <Clipboard className="w-4 h-4 text-green-500 print:hidden" />
                                    <span className="text-green-600 print:text-green-700">🔍 QC: {step.qualityCheck.result}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="mb-2 text-lg font-medium text-gray-900">No Journey Data</h3>
                    <p className="text-gray-600">Journey information is not available for this product.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Print Footer - Only visible in print */}
        <div className="hidden mt-8 print:block print-footer">
          <div className="text-center">
            <p className="mb-1">This report was generated by PharmaTrace - Pharmaceutical Supply Chain Verification System</p>
            <p className="mb-1">Report generated on: {new Date().toLocaleString('en-US', {
              year: 'numeric',
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              timeZoneName: 'short'
            })}</p>
            <p className="text-xs text-gray-500">
              Serial Number: {drugData?.product?.serialNumber} | Batch: {drugData?.product?.batchNumber}
            </p>
            <p className="mt-2 text-xs text-gray-500">
              For verification of this report, visit: www.pharmatrace.com/verify
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JourneyDetails;