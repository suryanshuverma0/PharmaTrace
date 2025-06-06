import React, { useState } from 'react';
import { 
  Scan,
  Calendar,
  MapPin,
  Check,
  Clock,
  ChevronRight,
  ArrowRight,
  Box,
  Shield,
  Activity,
  TrendingUp,
  AlertCircle,
  Search,
  Plus,
  MoreVertical
} from 'lucide-react';

const ConsumerDashboard = () => {
  const [showScanModal, setShowScanModal] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Sample data
  const sampleDrug = {
    name: "Amoxicillin",
    serialNumber: "AMX12345",
    manufacturer: "PharmaCorp Inc.",
    manufactureDate: "2025-01-15",
    expiryDate: "2027-01-15",
    status: "authentic",
    journey: [
      { step: "Manufactured", location: "Boston, USA", date: "2025-01-15", verified: true },
      { step: "Distributed", location: "Chicago, USA", date: "2025-01-20", verified: true },
      { step: "Pharmacy Received", location: "New York, USA", date: "2025-01-25", verified: true },
    ]
  };

  const recentVerifications = [
    { ...sampleDrug },
    { 
      ...sampleDrug,
      name: "Lisinopril",
      serialNumber: "LSP78901",
      status: "pending"
    },
    { 
      ...sampleDrug,
      name: "Metformin",
      serialNumber: "MTF45632",
      status: "authentic"
    }
  ];

  const stats = [
    { label: "Total Verified", value: "24", change: "+12%", trend: "up" },
    { label: "Authentic Products", value: "22", change: "+8%", trend: "up" },
    { label: "Pending Verification", value: "2", change: "-4%", trend: "down" },
    { label: "Success Rate", value: "91.7%", change: "+2.3%", trend: "up" }
  ];

  const handleVerifyDrug = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur-md border-gray-200/50">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-bold text-transparent bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text">
                  PharmaChain
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-600 transition-colors rounded-lg hover:text-gray-900 hover:bg-gray-100">
                <Search className="w-5 h-5" />
              </button>
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="mb-2 text-3xl font-bold text-gray-900">
                Good morning, John
              </h2>
              <p className="text-lg text-gray-600">
                Here's your pharmaceutical verification overview
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <button 
                onClick={() => setShowScanModal(true)}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <Scan className="w-5 h-5 mr-2" />
                Quick Verify
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 mb-8 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <div key={index} className="p-6 transition-all duration-300 border shadow-lg bg-white/70 backdrop-blur-sm rounded-2xl border-white/20 hover:shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="mb-1 text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`flex items-center space-x-1 text-sm font-medium ${
                  stat.trend === 'up' ? 'text-emerald-600' : 'text-red-500'
                }`}>
                  <TrendingUp className={`w-4 h-4 ${stat.trend === 'down' ? 'rotate-180' : ''}`} />
                  <span>{stat.change}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left Column - Quick Actions */}
          <div className="space-y-6 lg:col-span-1">
            {/* Verification Actions */}
            <div className="p-6 border shadow-lg bg-white/70 backdrop-blur-sm rounded-2xl border-white/20">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">Quick Actions</h3>
              <div className="space-y-3">
                <button 
                  onClick={() => setShowScanModal(true)}
                  className="flex items-center w-full p-4 transition-all duration-200 border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl hover:from-blue-100 hover:to-indigo-100 group"
                >
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <Scan className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 ml-4 text-left">
                    <p className="font-medium text-gray-900">Scan QR Code</p>
                    <p className="text-sm text-gray-600">Verify product authenticity</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 transition-colors group-hover:text-gray-600" />
                </button>

                <button className="flex items-center w-full p-4 transition-all duration-200 border bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200 rounded-xl hover:from-emerald-100 hover:to-teal-100 group">
                  <div className="p-2 rounded-lg bg-emerald-500">
                    <Plus className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 ml-4 text-left">
                    <p className="font-medium text-gray-900">Manual Entry</p>
                    <p className="text-sm text-gray-600">Enter serial number</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 transition-colors group-hover:text-gray-600" />
                </button>

                <button className="flex items-center w-full p-4 transition-all duration-200 border border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl hover:from-purple-100 hover:to-pink-100 group">
                  <div className="p-2 bg-purple-500 rounded-lg">
                    <Box className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 ml-4 text-left">
                    <p className="font-medium text-gray-900">View Vault</p>
                    <p className="text-sm text-gray-600">Manage saved products</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 transition-colors group-hover:text-gray-600" />
                </button>
              </div>
            </div>

            {/* Supply Chain Status */}
            <div className="p-6 border shadow-lg bg-white/70 backdrop-blur-sm rounded-2xl border-white/20">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">Supply Chain Status</h3>
              <div className="space-y-4">
                {sampleDrug.journey.map((step, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{step.step}</p>
                      <p className="text-xs text-gray-500">{step.location}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Recent Activity */}
          <div className="lg:col-span-2">
            <div className="border shadow-lg bg-white/70 backdrop-blur-sm rounded-2xl border-white/20">
              <div className="p-6 border-b border-gray-200/50">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Verifications</h3>
                  <button className="text-sm font-medium text-blue-600 hover:text-blue-700">
                    View All
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {recentVerifications.map((drug, index) => (
                    <div key={drug.serialNumber} className="group">
                      <div className="flex items-center justify-between p-4 transition-all duration-200 border rounded-xl border-gray-200/50 hover:border-blue-200 hover:shadow-md bg-white/50">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            {drug.status === 'authentic' ? (
                              <div className="flex items-center justify-center w-12 h-12 bg-emerald-100 rounded-xl">
                                <Check className="w-6 h-6 text-emerald-600" />
                              </div>
                            ) : (
                              <div className="flex items-center justify-center w-12 h-12 bg-amber-100 rounded-xl">
                                <Clock className="w-6 h-6 text-amber-600" />
                              </div>
                            )}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{drug.name}</h4>
                            <p className="text-sm text-gray-500">Serial: {drug.serialNumber}</p>
                            <p className="text-xs text-gray-400">Exp: {drug.expiryDate}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            drug.status === 'authentic' 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {drug.status === 'authentic' ? 'Verified' : 'Pending'}
                          </span>
                          <button className="p-1 text-gray-400 hover:text-gray-600">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Journey Section */}
        <div className="mt-8">
          <div className="border shadow-lg bg-white/70 backdrop-blur-sm rounded-2xl border-white/20">
            <div className="p-6 border-b border-gray-200/50">
              <h3 className="text-lg font-semibold text-gray-900">Supply Chain Journey - {sampleDrug.name}</h3>
            </div>
            <div className="p-6">
              <div className="relative">
                <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-gray-200"></div>
                {sampleDrug.journey.map((step, index) => (
                  <div key={index} className="relative flex items-start mb-8 last:mb-0">
                    <div className="absolute z-10 flex items-center justify-center w-6 h-6 rounded-full left-3 bg-emerald-500">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    <div className="flex-1 p-4 ml-12 border bg-white/50 rounded-xl border-gray-200/50">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-900">{step.step}</h4>
                          <div className="flex items-center mt-2 space-x-4 text-sm text-gray-600">
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              {step.date}
                            </div>
                            <div className="flex items-center">
                              <MapPin className="w-4 h-4 mr-1" />
                              {step.location}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="inline-flex items-center px-2 py-1 text-xs rounded-full bg-emerald-100 text-emerald-800">
                            <Activity className="w-3 h-3 mr-1" />
                            Verified
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* QR Scanner Modal */}
      {showScanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 bg-white shadow-2xl rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Scan QR Code</h3>
              <button 
                onClick={() => setShowScanModal(false)}
                className="p-2 text-gray-400 rounded-lg hover:text-gray-600 hover:bg-gray-100"
              >
                ×
              </button>
            </div>
            <div className="mb-6">
              <p className="mb-4 text-gray-600">Position the QR code within the frame to scan</p>
              <div className="flex items-center justify-center border-2 border-gray-300 border-dashed aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl">
                <div className="text-center">
                  <Scan className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-500">Camera feed</p>
                </div>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowScanModal(false)}
                className="flex-1 px-4 py-2 text-gray-700 transition-colors bg-gray-100 rounded-xl hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowScanModal(false);
                  handleVerifyDrug();
                }}
                className="flex-1 px-4 py-2 text-white transition-colors bg-blue-600 rounded-xl hover:bg-blue-700"
              >
                Verify Product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsumerDashboard;