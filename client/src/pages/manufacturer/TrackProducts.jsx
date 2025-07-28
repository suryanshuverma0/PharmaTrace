import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search,
  Route,
  Package,
  MapPin,
  Calendar,
  Box,
  CheckCircle,
  Factory,
  Truck,
  Store,
  User,
  AlertCircle
} from 'lucide-react';
import { Card } from '../../components/UI/Card';
import { Input } from '../../components/UI/Input';
import { Button } from '../../components/UI/Button';
import { ProductTrackingSkeleton } from '../../components/UI/Skeleton';
import apiClient from '../../services/api/api';

const TrackProducts = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Function to format journey data
  const formatJourneyData = (product) => {
    const journey = [];

    // Add manufacturing step
    journey.push({
      step: "Manufactured",
      location: product.productionLocation || "Manufacturing Facility",
      date: new Date(product.manufactureDate).toLocaleString(),
      verifiedBy: product.manufacturer,
      role: "Manufacturer",
      temperature: product.storageTemp || "20°C",
      humidity: product.humidity || "45%"
    });

    // Add quality check if available
    if (product.qualityCheck) {
      journey.push({
        step: "Quality Check",
        location: product.productionLocation,
        date: new Date(product.qualityCheckDate).toLocaleString(),
        verifiedBy: product.qualityCheckBy || "QA Team",
        role: "QA Specialist",
        status: "Passed",
        notes: product.qualityNotes || "Meets all quality standards"
      });
    }

    // Add shipping info if in transit or delivered
    if (product.status === 'in-transit' || product.status === 'delivered') {
      journey.push({
        step: "Shipped",
        location: product.shipmentOrigin || product.productionLocation,
        date: new Date(product.shipmentDate).toLocaleString(),
        verifiedBy: product.shipmentVerifiedBy || "Logistics Team",
        role: "Logistics Manager",
        carrier: product.carrier || "SecurePharm Logistics",
        trackingId: product.trackingId
      });
    }

    // Add current status
    journey.push({
      step: product.status?.charAt(0).toUpperCase() + product.status?.slice(1) || "In Processing",
      location: product.currentLocation || "Manufacturing Facility",
      date: new Date().toLocaleString(),
      verifiedBy: product.lastVerifiedBy || "System",
      role: "Status Update",
      storageConditions: `Temperature: ${product.currentTemp || "20°C"}, Humidity: ${product.currentHumidity || "45%"}`
    });

    return journey;
  };
  const sampleProduct = {
    name: "Amoxicillin 500mg",
    serialNumber: "AMX500-B247",
    batchNumber: "B247",
    manufacturer: "PharmaCorp Inc.",
    currentLocation: "Chicago Distribution Center",
    journey: [
      {
        step: "Manufactured",
        location: "Boston Manufacturing Facility",
        date: "2025-06-01 09:30 AM",
        verifiedBy: "John Smith",
        role: "Production Manager",
        temperature: "21°C",
        humidity: "45%"
      },
      {
        step: "Quality Check",
        location: "Boston Manufacturing Facility",
        date: "2025-06-01 02:15 PM",
        verifiedBy: "Sarah Johnson",
        role: "QA Specialist",
        status: "Passed",
        notes: "Meets all quality standards"
      },
      {
        step: "Shipped",
        location: "Boston Manufacturing Facility",
        date: "2025-06-02 10:45 AM",
        verifiedBy: "Mike Wilson",
        role: "Logistics Manager",
        carrier: "SecurePharm Logistics",
        trackingId: "SP12345678"
      },
      {
        step: "In Transit",
        location: "Chicago Distribution Center",
        date: "2025-06-03 03:20 PM",
        verifiedBy: "David Chen",
        role: "Distribution Manager",
        status: "Arrived",
        storageConditions: "Temperature: 20°C, Humidity: 40%"
      }
    ]
  };

  const handleSearch = async (serialNumber) => {
    if (!serialNumber.trim()) {
      setError("Please enter a serial number");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSelectedProduct(null);

      const response = await apiClient.get(`/tracking/track/${serialNumber}`);
      const product = response.data;

      // Format the product data with journey
      const formattedProduct = {
        ...product,
        journey: formatJourneyData(product)
      };

      setSelectedProduct(formattedProduct);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to find product. Please check the serial number.");
      setSelectedProduct(null);
    } finally {
      setLoading(false);
    }
  };

  const getStepIcon = (step) => {
    switch (step.toLowerCase()) {
      case 'manufactured':
        return <Factory className="w-6 h-6" />;
      case 'quality check':
        return <CheckCircle className="w-6 h-6" />;
      case 'shipped':
        return <Package className="w-6 h-6" />;
      case 'in transit':
        return <Truck className="w-6 h-6" />;
      case 'delivered':
        return <Store className="w-6 h-6" />;
      default:
        return <Box className="w-6 h-6" />;
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Track Products</h1>
        <p className="mt-2 text-lg text-gray-600">
          Monitor your products throughout the supply chain journey
        </p>
      </div>

      {/* Search Section */}
      <Card className="mb-8">
        <div className="p-6">
          <div className="max-w-xl">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Enter Serial Number
            </h3>
            <div className="flex gap-4">
              <Input
                placeholder="Enter product serial number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={<Search className="w-5 h-5" />}
                className="flex-1"
              />
              <Button
                variant="primary"
                onClick={() => handleSearch(searchQuery)}
                className="px-6"
              >
                Track
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 mb-6 text-red-800 bg-red-100 rounded-xl"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <p>{error}</p>
          </div>
        </motion.div>
      )}

      {/* Loading State */}
      {loading && <ProductTrackingSkeleton />}

      {/* Product Journey */}
      {!loading && selectedProduct && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Product Info */}
          <Card>
            <div className="p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedProduct.name}
                  </h2>
                  <div className="mt-2 space-y-1">
                    <p className="text-gray-600">
                      Serial Number: {selectedProduct.serialNumber}
                    </p>
                    <p className="text-gray-600">
                      Batch Number: {selectedProduct.batchNumber}
                    </p>
                  </div>
                </div>
                <div className="px-4 py-2 text-sm text-blue-800 bg-blue-100 rounded-lg">
                  Current Location: {selectedProduct.currentLocation}
                </div>
              </div>
            </div>
          </Card>

          {/* Journey Timeline */}
          <Card>
            <div className="p-6">
              <h3 className="mb-6 text-lg font-semibold text-gray-900">
                Supply Chain Journey
              </h3>
              <div className="relative">
                <div className="absolute left-8 top-3 bottom-3 w-0.5 bg-gray-200"></div>
                <div className="space-y-8">
                  {selectedProduct.journey.map((step, index) => (
                    <div key={index} className="relative flex gap-6">
                      <div className="relative flex items-center justify-center flex-shrink-0 w-16 h-16 p-4 bg-white border rounded-full shadow-sm">
                        <div className="text-blue-600">
                          {getStepIcon(step.step)}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="p-6 bg-white border shadow-sm rounded-xl">
                          <div className="flex flex-wrap items-center justify-between gap-4">
                            <div>
                              <h4 className="text-lg font-semibold text-gray-900">
                                {step.step}
                              </h4>
                              <div className="mt-1 space-y-1">
                                <div className="flex items-center text-gray-600">
                                  <MapPin className="w-4 h-4 mr-1" />
                                  {step.location}
                                </div>
                                <div className="flex items-center text-gray-600">
                                  <Calendar className="w-4 h-4 mr-1" />
                                  {step.date}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center text-gray-600">
                                <User className="w-4 h-4 mr-1" />
                                {step.verifiedBy}
                              </div>
                              <div className="text-sm text-gray-500">
                                {step.role}
                              </div>
                            </div>
                          </div>
                          {Object.entries(step).map(([key, value]) => {
                            if (!['step', 'location', 'date', 'verifiedBy', 'role'].includes(key)) {
                              return (
                                <div key={key} className="pt-4 mt-4 border-t">
                                  <div className="text-sm text-gray-600">
                                    <span className="font-medium">{key.charAt(0).toUpperCase() + key.slice(1)}:</span>{' '}
                                    {value}
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default TrackProducts;
