import React, { useState, useEffect } from 'react';
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
  Clock,
  CheckCircle,
  ExternalLink,
  Eye,
  Package
} from 'lucide-react';

const JourneyDetails = () => {
  const [loading, setLoading] = useState(true);
  const [drugData, setDrugData] = useState(null);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    // Simulated API call
    setTimeout(() => {
      setDrugData({
        isAuthentic: true,
        productName: "Amoxicillin 500mg",
        manufacturer: "PharmaCorp Inc.",
        serialNumber: "AMX123456789",
        batchNumber: "BATCH123",
        manufactureDate: "2025-01-15",
        expiryDate: "2027-01-15",
        dosageForm: "Capsules",
        strength: "500mg",
        packSize: "30 capsules",
        regulatoryInfo: "FDA Approved - NDC 12345-678-90",
        journey: [
          {
            step: "Manufacturing",
            date: "2025-01-15",
            time: "08:30 AM",
            location: "Boston, Massachusetts, USA",
            actor: "PharmaCorp Manufacturing Facility",
            details: "Product manufactured under strict GMP guidelines with full batch documentation. Quality parameters verified and recorded.",
            icon: Building2,
            verified: true,
            status: "completed",
            temperature: "20-25°C",
            humidity: "45-65%"
          },
          {
            step: "Quality Control",
            date: "2025-01-16",
            time: "02:15 PM",
            location: "Boston, Massachusetts, USA",
            actor: "PharmaCorp QC Laboratory",
            details: "Comprehensive batch testing completed including potency, purity, dissolution, and microbiological testing. All parameters within specification.",
            icon: Clipboard,
            verified: true,
            status: "completed",
            testResults: "All tests passed"
          },
          {
            step: "Distribution Center",
            date: "2025-01-20",
            time: "11:45 AM",
            location: "Chicago, Illinois, USA",
            actor: "MedLogistics Distribution Center",
            details: "Product received, inspected, and stored under controlled temperature and humidity conditions. Chain of custody maintained.",
            icon: Truck,
            verified: true,
            status: "completed",
            temperature: "15-25°C",
            storageConditions: "Controlled environment"
          },
          {
            step: "Pharmacy Received",
            date: "2025-01-25",
            time: "09:20 AM",
            location: "New York, New York, USA",
            actor: "HealthCare Pharmacy Network",
            details: "Product successfully delivered and verified. Added to pharmacy inventory system with full traceability.",
            icon: Store,
            verified: true,
            status: "completed",
            pharmacyLicense: "NY-PHARM-12345"
          }
        ]
      });
      setLoading(false);
    }, 1500);
  }, []);

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

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-emerald-600 bg-emerald-100';
      case 'pending': return 'text-amber-600 bg-amber-100';
      case 'failed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getDaysUntilExpiry = () => {
    const today = new Date();
    const expiry = new Date(drugData.expiryDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur-md border-gray-200/50">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button className="flex items-center px-3 py-2 text-gray-600 transition-colors rounded-lg hover:text-gray-900 hover:bg-gray-100">
                <ChevronLeft className="w-5 h-5 mr-1" />
                Back to Dashboard
              </button>
              <div className="w-px h-6 bg-gray-300"></div>
              <div className="flex items-center space-x-2">
                <Package className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-gray-900">Product Journey</span>
              </div>
            </div>
            <div className="flex items-center space-x-3">
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
          <div className="p-6 text-white shadow-lg bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl">
                  <Shield className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="mb-1 text-2xl font-bold">{drugData.productName}</h1>
                  <p className="text-emerald-100">Serial: {drugData.serialNumber}</p>
                  <div className="flex items-center mt-2">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    <span className="font-semibold">Verified Authentic</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-emerald-100">Journey Status</div>
                <div className="text-2xl font-bold">100% Complete</div>
                <div className="text-sm text-emerald-100">{drugData.journey.length} steps verified</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Product Information */}
          <div className="space-y-6 lg:col-span-1">
            <div className="p-6 border shadow-lg bg-white/70 backdrop-blur-sm rounded-2xl border-white/20">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Product Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Product Name</label>
                  <p className="font-medium text-gray-900">{drugData.productName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Manufacturer</label>
                  <p className="text-gray-900">{drugData.manufacturer}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Batch Number</label>
                  <p className="font-mono text-gray-900">{drugData.batchNumber}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Strength</label>
                  <p className="text-gray-900">{drugData.strength}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Pack Size</label>
                  <p className="text-gray-900">{drugData.packSize}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Regulatory Info</label>
                  <p className="text-sm text-gray-900">{drugData.regulatoryInfo}</p>
                </div>
              </div>
            </div>

            {/* Expiry Information */}
            <div className="p-6 border shadow-lg bg-white/70 backdrop-blur-sm rounded-2xl border-white/20">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">Expiry Information</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Manufactured</span>
                  <span className="font-medium">{drugData.manufactureDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Expires</span>
                  <span className="font-medium">{drugData.expiryDate}</span>
                </div>
                <div className="pt-3 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Days Remaining</span>
                    <span className={`font-bold ${getDaysUntilExpiry() > 180 ? 'text-blue-600' : getDaysUntilExpiry() > 30 ? 'text-amber-600' : 'text-red-600'}`}>
                      {getDaysUntilExpiry()} days
                    </span>
                  </div>
                  <div className="h-2 mt-2 bg-gray-200 rounded-full">
                    <div 
                      className={`h-2 rounded-full ${getDaysUntilExpiry() > 180 ? 'bg-blue-500' : getDaysUntilExpiry() > 30 ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${Math.max(10, Math.min(100, (getDaysUntilExpiry() / 730) * 100))}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button className="flex items-center justify-center w-full px-4 py-3 text-white transition-colors bg-blue-600 shadow-lg rounded-xl hover:bg-blue-700 hover:shadow-xl">
                <Save className="w-5 h-5 mr-2" />
                Save to Vault
              </button>
              <button className="flex items-center justify-center w-full px-4 py-3 text-gray-700 transition-colors bg-gray-100 rounded-xl hover:bg-gray-200">
                <Download className="w-5 h-5 mr-2" />
                Download Report
              </button>
            </div>
          </div>

          {/* Journey Timeline */}
          <div className="lg:col-span-2">
            <div className="border shadow-lg bg-white/70 backdrop-blur-sm rounded-2xl border-white/20">
              <div className="p-6 border-b border-gray-200/50">
                <h2 className="text-xl font-semibold text-gray-900">Supply Chain Journey</h2>
                <p className="mt-1 text-gray-600">Complete tracking history with verification details</p>
              </div>
              <div className="p-6">
                <div className="relative">
                  {/* Progress Line */}
                  <div className="absolute left-8 top-8 bottom-8 w-0.5 bg-gradient-to-b from-blue-500 to-blue-300"></div>
                  
                  {drugData.journey.map((step, index) => (
                    <div 
                      key={index} 
                      className={`relative mb-8 last:mb-0 transition-all duration-300 ${activeStep === index ? 'scale-105' : ''}`}
                      onMouseEnter={() => setActiveStep(index)}
                      onMouseLeave={() => setActiveStep(-1)}
                    >
                      {/* Timeline Icon */}
                      <div className="absolute z-10 flex items-center justify-center w-8 h-8 bg-blue-500 rounded-full shadow-lg left-4">
                        {React.createElement(step.icon, {
                          className: "w-4 h-4 text-white"
                        })}
                      </div>
                      
                      {/* Content Card */}
                      <div className={`ml-16 bg-white/60 rounded-xl border transition-all duration-300 ${
                        activeStep === index 
                          ? 'border-blue-300 shadow-lg bg-white/80' 
                          : 'border-gray-200/50 hover:border-gray-300 hover:shadow-md'
                      }`}>
                        <div className="p-6">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="mb-1 text-lg font-semibold text-gray-900">{step.step}</h3>
                              <p className="font-medium text-gray-600">{step.actor}</p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(step.status)}`}>
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Verified
                              </span>
                            </div>
                          </div>
                          
                          <p className="mb-4 leading-relaxed text-gray-600">{step.details}</p>
                          
                          {/* Metadata */}
                          <div className="grid grid-cols-1 gap-4 mb-4 sm:grid-cols-2">
                            <div className="flex items-center text-sm text-gray-500">
                              <Calendar className="w-4 h-4 mr-2" />
                              <span>{step.date} at {step.time}</span>
                            </div>
                            <div className="flex items-center text-sm text-gray-500">
                              <MapPin className="w-4 h-4 mr-2" />
                              <span>{step.location}</span>
                            </div>
                          </div>

                          {/* Additional Details */}
                          {(step.temperature || step.humidity || step.testResults || step.storageConditions || step.pharmacyLicense) && (
                            <div className="p-4 mt-4 rounded-lg bg-gray-50/50">
                              <h4 className="mb-2 text-sm font-medium text-gray-700">Additional Details</h4>
                              <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                                {step.temperature && (
                                  <div className="text-gray-600">
                                    <span className="font-medium">Temperature:</span> {step.temperature}
                                  </div>
                                )}
                                {step.humidity && (
                                  <div className="text-gray-600">
                                    <span className="font-medium">Humidity:</span> {step.humidity}
                                  </div>
                                )}
                                {step.testResults && (
                                  <div className="text-gray-600">
                                    <span className="font-medium">Test Results:</span> {step.testResults}
                                  </div>
                                )}
                                {step.storageConditions && (
                                  <div className="text-gray-600">
                                    <span className="font-medium">Storage:</span> {step.storageConditions}
                                  </div>
                                )}
                                {step.pharmacyLicense && (
                                  <div className="text-gray-600">
                                    <span className="font-medium">License:</span> {step.pharmacyLicense}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Verification Summary */}
        <div className="mt-8">
          <div className="p-6 border shadow-lg bg-white/70 backdrop-blur-sm rounded-2xl border-white/20">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Verification Summary</h3>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-12 h-12 bg-emerald-100 rounded-xl">
                  <Shield className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">100% Authentic</p>
                  <p className="text-sm text-gray-600">Verified by blockchain</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">4 Checkpoints</p>
                  <p className="text-sm text-gray-600">All verified successfully</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-xl">
                  <ExternalLink className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Chain Complete</p>
                  <p className="text-sm text-gray-600">End-to-end visibility</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JourneyDetails;