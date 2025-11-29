import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
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
  const { serialNumber: urlSerialNumber } = useParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Function to format journey data - now using backend data directly
  const formatJourneyData = (product) => {
    // Backend now provides properly formatted journey data
    return product.journey || [];
  };

  // Effect to handle URL parameter and auto-track
  useEffect(() => {
    if (urlSerialNumber) {
      setSearchQuery(urlSerialNumber);
      handleSearch(urlSerialNumber);
    }
  }, [urlSerialNumber]);

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

      // Product data already includes formatted journey from backend
      setSelectedProduct(product);
    } catch (err) {
      console.error('Error tracking product:', err);
      if (err.response?.status === 403) {
        setError("You can only track products from your own batches.");
      } else if (err.response?.status === 404) {
        setError("Product not found. Please check the serial number.");
      } else {
        setError(err.response?.data?.message || "Failed to find product. Please check the serial number.");
      }
      setSelectedProduct(null);
    } finally {
      setLoading(false);
    }
  };

  const getStepIcon = (step) => {
    const stepLower = step.toLowerCase();
    switch (stepLower) {
      case 'manufactured':
      case 'manufacturing':
        return <Factory className="w-6 h-6" />;
      case 'quality check':
      case 'quality checked':
        return <CheckCircle className="w-6 h-6" />;
      case 'shipped':
      case 'dispatched':
        return <Package className="w-6 h-6" />;
      case 'in transit':
      case 'received':
      case 'stored':
        return <Truck className="w-6 h-6" />;
      case 'delivered':
        return <Store className="w-6 h-6" />;
      case 'current status':
        return <MapPin className="w-6 h-6" />;
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
              <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedProduct.name || selectedProduct.productName}
                  </h2>
                  <div className="mt-2 space-y-1">
                    <p className="text-gray-600">
                      Serial Number: <span className="font-medium">{selectedProduct.serialNumber}</span>
                    </p>
                    <p className="text-gray-600">
                      Batch Number: <span className="font-medium">{selectedProduct.batchNumber}</span>
                    </p>
                    <p className="text-gray-600">
                      Manufactured: <span className="font-medium">{new Date(selectedProduct.manufactureDate).toLocaleDateString()}</span>
                    </p>
                    <p className="text-gray-600">
                      Expires: <span className="font-medium">{new Date(selectedProduct.expiryDate).toLocaleDateString()}</span>
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className={`px-4 py-2 text-sm font-medium rounded-lg ${
                    selectedProduct.status === 'delivered' ? 'bg-green-100 text-green-800' :
                    selectedProduct.status === 'in-transit' || selectedProduct.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                    selectedProduct.status === 'produced' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    Status: {selectedProduct.status?.charAt(0).toUpperCase() + selectedProduct.status?.slice(1) || 'Unknown'}
                  </div>
                  <div className="px-4 py-2 text-sm text-purple-800 bg-purple-100 rounded-lg">
                    Location: {selectedProduct.currentLocation}
                  </div>
                  {selectedProduct.blockchainVerified && (
                    <div className="flex items-center gap-1 px-4 py-2 text-sm text-green-800 bg-green-100 rounded-lg">
                      <CheckCircle className="w-4 h-4" />
                      Blockchain Verified
                    </div>
                  )}
                </div>
              </div>

              {/* Batch Details */}
              {selectedProduct.batchDetails && (
                <div className="pt-4 border-t">
                  <h4 className="mb-3 text-lg font-semibold text-gray-900">Batch Information</h4>
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    <div className="p-3 text-center rounded-lg bg-gray-50">
                      <div className="text-2xl font-bold text-blue-600">
                        {selectedProduct.batchDetails.quantityProduced}
                      </div>
                      <div className="text-sm text-gray-600">Total Produced</div>
                    </div>
                    <div className="p-3 text-center rounded-lg bg-gray-50">
                      <div className="text-2xl font-bold text-green-600">
                        {selectedProduct.batchDetails.quantityAvailable}
                      </div>
                      <div className="text-sm text-gray-600">Available</div>
                    </div>
                    <div className="p-3 text-center rounded-lg bg-gray-50">
                      <div className="text-2xl font-bold text-orange-600">
                        {selectedProduct.batchDetails.quantityAssigned}
                      </div>
                      <div className="text-sm text-gray-600">Assigned</div>
                    </div>
                    <div className="p-3 text-center rounded-lg bg-gray-50">
                      <div className="text-2xl font-bold text-purple-600">
                        {selectedProduct.totalShipments || 0}
                      </div>
                      <div className="text-sm text-gray-600">Shipments</div>
                    </div>
                  </div>
                </div>
              )}
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
                      <div className={`relative flex items-center justify-center flex-shrink-0 w-16 h-16 p-4 border rounded-full shadow-sm ${
                        step.isCurrentStatus ? 'bg-blue-50 border-blue-200' : 'bg-white'
                      }`}>
                        <div className={`${step.isCurrentStatus ? 'text-blue-600' : 'text-blue-600'}`}>
                          {getStepIcon(step.step)}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className={`p-6 border shadow-sm rounded-xl ${
                          step.isCurrentStatus ? 'bg-blue-50 border-blue-200' : 'bg-white'
                        }`}>
                          <div className="flex flex-wrap items-center justify-between gap-4">
                            <div>
                              <h4 className="text-lg font-semibold text-gray-900">
                                {step.step}
                              </h4>
                              <div className="mt-1 space-y-1">
                                <div className="flex items-center text-gray-600">
                                  <MapPin className="w-4 h-4 mr-1" />
                                  {step.location}
                                  {step.fromLocation && (
                                    <span className="ml-2 text-gray-500">
                                      (from {step.fromLocation})
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center text-gray-600">
                                  <Calendar className="w-4 h-4 mr-1" />
                                  {new Date(step.date).toLocaleString()}
                                </div>
                                {step.quantity && (
                                  <div className="flex items-center text-gray-600">
                                    <Package className="w-4 h-4 mr-1" />
                                    Quantity: {step.quantity}
                                  </div>
                                )}
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
                              {step.status && (
                                <div className={`mt-1 px-2 py-1 text-xs rounded-full ${
                                  step.status === 'Completed' || step.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                                  step.status === 'In Transit' ? 'bg-blue-100 text-blue-800' :
                                  step.status === 'Produced' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {step.status}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Additional details */}
                          <div className="grid grid-cols-1 gap-4 pt-4 mt-4 border-t md:grid-cols-2">
                            {/* Shipping details */}
                            {(step.carrier || step.trackingId) && (
                              <div className="space-y-1">
                                <h6 className="text-sm font-medium text-gray-700">Shipping Details</h6>
                                {step.carrier && (
                                  <p className="text-sm text-gray-600">Carrier: {step.carrier}</p>
                                )}
                                {step.trackingId && (
                                  <p className="text-sm text-gray-600">Tracking: {step.trackingId}</p>
                                )}
                              </div>
                            )}

                            {/* Blockchain info */}
                            {step.txHash && (
                              <div className="space-y-1">
                                <h6 className="text-sm font-medium text-gray-700">Blockchain</h6>
                                <p className="font-mono text-sm text-gray-600">
                                  Tx: {step.txHash.substring(0, 12)}...
                                </p>
                              </div>
                            )}

                            {/* Additional remarks */}
                            {step.remarks && (
                              <div className="space-y-1 md:col-span-2">
                                <h6 className="text-sm font-medium text-gray-700">Remarks</h6>
                                <p className="text-sm text-gray-600">{step.remarks}</p>
                              </div>
                            )}

                            {/* Batch info for manufacturing step */}
                            {step.batchNumber && step.quantityProduced && (
                              <div className="space-y-1 md:col-span-2">
                                <h6 className="text-sm font-medium text-gray-700">Batch Details</h6>
                                <p className="text-sm text-gray-600">
                                  Batch: {step.batchNumber} | Quantity: {step.quantityProduced}
                                </p>
                              </div>
                            )}
                          </div>
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
