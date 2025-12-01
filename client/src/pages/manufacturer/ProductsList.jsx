import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Search,
  Filter,
  Download,
  Box,
  Route,
  QrCode,
  MoreVertical,
  Calendar,
  MapPin,
  AlertCircle,
  Boxes,
  Printer,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Input } from '../../components/UI/Input';
import { Button } from '../../components/UI/Button';
import { Select } from '../../components/UI/Select';
import apiClient from '../../services/api/api';
import ProductDetailsModal from '../../components/modals/ProductDetailsModal';
import ProductModal from '../../components/modals/ProductModal';
import ModalWrapper from '../../components/common/ModalWrapper';
const ProductsList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [collapsedBatches, setCollapsedBatches] = useState(new Set());

  // Options for the Select component
  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'produced', label: 'Manufactured' },
    { value: 'in-transit', label: 'In Transit' },
    { value: 'delivered', label: 'Delivered' }
  ];

  // State for modals
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);

  // Fetch registered batches with products from the backend
  const getRegisteredProducts = async () => {
    try {
      setLoading(true);
      const [batchResponse, profileResponse] = await Promise.all([
        apiClient.get('products/registered-batches'),
        apiClient.get('/manufacturer/profile')
      ]);
      
      const manufacturerProfile = profileResponse.data;
      
      // Response should be grouped by batch with products inside
      const normalizedBatches = batchResponse.data.map(batch => ({
        ...batch,
        status: batch.shipmentStatus.toLowerCase().replace(/\s+/g, '-'),
        products: batch.products.map(product => {
          // Parse the QR code data if it exists
          let qrData = {};
          try {
            if (product.qrCodeUrl) {
              const qrDataString = product.qrCodeUrl.split(',')[1]; // Get base64 part
              const decodedString = atob(qrDataString); // Decode base64
              qrData = JSON.parse(decodedString);
            }
          } catch (e) {
            console.log('Error parsing QR data:', e);
          }

          return {
            ...product,
            ...qrData, // This includes manufactureDate and expiryDate from QR
            status: product.status?.replace(/\s+/g, '-').toLowerCase() || 'produced',
            batchNumber: batch.batchNumber,
            // Fallback to batch dates if QR data is not available
            manufactureDate: qrData.manufactureDate || batch.manufactureDate,
            expiryDate: qrData.expiryDate || batch.expiryDate,
            // Add manufacturer details
            productionLocation: manufacturerProfile.address,
            manufacturer: manufacturerProfile.companyName,
            manufacturerCountry: manufacturerProfile.country || 'Nepal',
            manufacturerAddress: manufacturerProfile.address
          };
        })
      }));
      setProducts(normalizedBatches);
      
      // Set all batches as collapsed by default
      const batchIds = new Set(normalizedBatches.map(batch => batch._id));
      setCollapsedBatches(batchIds);
      
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  // Fetch products on component mount
  useEffect(() => {
    getRegisteredProducts();
  }, []);

  // Filter batches based on search term and status
  const filteredBatches = products.filter(batch => {
    const hasMatchingProducts = batch.products.some(product => 
      product.productName.toLowerCase().includes(searchTerm.toLowerCase().trim())
    );
    const matchesBatchNumber = batch.batchNumber.toLowerCase().includes(searchTerm.toLowerCase().trim());
    const matchesFilter = filterStatus === 'all' || batch.status === filterStatus;
    
    return (hasMatchingProducts || matchesBatchNumber) && matchesFilter;
  });

  // Handle modal actions
  const handleQRCodeClick = (product) => {
    setSelectedProduct(product);
    setShowQRModal(true);
  };

  const handleProductClick = (product, batch) => {
    setSelectedProduct(product);
    setSelectedBatch(batch);
    setShowProductModal(true);
  };

  const downloadQRCode = (qrCodeUrl, fileName) => {
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Debounce search input to improve performance
  const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  // Handle search input change with debouncing
  const handleSearchChange = useCallback(
    debounce((value) => {
      setSearchTerm(value);
    }, 300),
    []
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'manufactured':
      case 'produced':
        return 'bg-blue-100 text-blue-800';
      case 'in-transit':
        return 'bg-amber-100 text-amber-800';
      case 'delivered':
        return 'bg-emerald-100 text-emerald-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const toggleBatchCollapse = (batchId) => {
    setCollapsedBatches(prev => {
      const newSet = new Set(prev);
      if (newSet.has(batchId)) {
        newSet.delete(batchId);
      } else {
        newSet.add(batchId);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen p-6 animate-pulse">
        {/* Header Skeleton */}
        <div className="mb-8">
          <div className="h-8 mb-2 bg-gray-200 rounded w-72"></div>
          <div className="h-6 bg-gray-200 rounded w-96"></div>
        </div>

        {/* Filters and Search Skeleton */}
        <div className="grid gap-4 mb-6 md:flex md:items-center md:justify-between">
          <div className="flex items-center justify-between flex-1 gap-4">
            <div className="w-40 h-10 bg-gray-200 rounded-lg"></div>
          </div>
          <div className="w-24 h-10 bg-gray-200 rounded-lg"></div>
        </div>

        {/* Batches List Skeleton */}
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, batchIndex) => (
            <div key={batchIndex} className="overflow-hidden bg-white border shadow-lg rounded-2xl border-gray-200/50">
              {/* Batch Header Skeleton */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex flex-wrap items-start justify-between gap-4 sm:flex-nowrap">
                  <div className="flex items-start flex-1 gap-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
                    <div className="flex-1 min-w-0 space-y-3">
                      <div className="w-40 h-6 bg-gray-200 rounded"></div>
                      <div className="space-y-1">
                        <div className="flex flex-wrap gap-4">
                          <div className="flex items-center gap-1">
                            <div className="w-4 h-4 bg-gray-200 rounded"></div>
                            <div className="w-20 h-4 bg-gray-200 rounded"></div>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-4 h-4 bg-gray-200 rounded"></div>
                            <div className="w-20 h-4 bg-gray-200 rounded"></div>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-4 h-4 bg-gray-200 rounded"></div>
                            <div className="w-16 h-4 bg-gray-200 rounded"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="w-20 h-6 bg-gray-200 rounded-full"></div>
                </div>
              </div>

              {/* Products Grid Skeleton */}
              <div className="p-6 bg-gray-50">
                <div className="grid grid-cols-1 gap-4">
                  {Array.from({ length: 2 }).map((_, productIndex) => (
                    <div key={productIndex} className="p-4 bg-white border rounded-xl border-gray-200/50">
                      <div className="flex justify-between">
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="w-48 h-5 bg-gray-200 rounded"></div>
                          <div className="w-32 h-4 bg-gray-200 rounded"></div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="bg-gray-200 rounded-lg w-9 h-9"></div>
                          <div className="bg-gray-200 rounded-lg w-9 h-9"></div>
                          <div className="bg-gray-200 rounded-lg w-9 h-9"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-600">Error: {error}</p>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Registered Products</h1>
          <p className="mt-2 text-lg text-gray-600">
            View and manage all your registered pharmaceutical products
          </p>
        </div>

      {/* Filters and Search */}
      <div className="grid gap-4 mb-6 md:flex md:items-center md:justify-between">
        <div className="flex items-center justify-between flex-1 gap-4">
      
          <Select
            options={statusOptions}
            value={filterStatus}
            onChange={setFilterStatus}
            className="w-40 h-10 text-sm border-gray-300 rounded-lg"
            icon={<Filter className="w-5 h-5" />}
            placeholder="Select status"
          />
        </div>
        <Button
          variant="secondary"
          className="flex items-center h-10 gap-2 text-sm border-gray-300 rounded-lg"
        >
          <Download className="w-5 h-5" />
          Export
        </Button>
      </div>

      {/* Batches List */}
      <div className="space-y-6">
        {filteredBatches.length === 0 ? (
          <p className="text-gray-600">No batches found.</p>
        ) : (
          filteredBatches.map((batch) => (
            <motion.div
              key={batch._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="overflow-hidden bg-white border shadow-lg rounded-2xl border-gray-200/50"
            >
              {/* Batch Header */}
              <div 
                className="p-6 transition-colors border-b border-gray-100 cursor-pointer hover:bg-gray-50"
                onClick={() => toggleBatchCollapse(batch._id)}
              >
                <div className="flex flex-wrap items-start justify-between gap-4 sm:flex-nowrap">
                  <div className="flex items-start flex-1 gap-4">
                    <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 bg-blue-100 rounded-xl">
                      <Boxes className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Batch: {batch.batchNumber}
                      </h3>
                      <div className="mt-1 space-y-1">
                        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>Mfg: {new Date(batch.manufactureDate).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>Exp: {new Date(batch.expiryDate).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Box className="w-4 h-4" />
                            <span>Products: {batch.products.length}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(batch.status)}`}>
                      {batch.status.charAt(0).toUpperCase() + batch.status.slice(1)}
                    </span>
                    {collapsedBatches.has(batch._id) ? (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* Products Grid - Collapsible */}
              {!collapsedBatches.has(batch._id) && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="p-6 bg-gray-50"
                >
                  <div className="grid grid-cols-1 gap-4">
                    {batch.products.map((product) => (
                      <div
                        key={product._id}
                        className="p-4 transition-all duration-200 bg-white border rounded-xl border-gray-200/50 hover:border-blue-200 hover:shadow-md"
                      >
                        <div className="flex justify-between">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 truncate">
                              {product.productName}
                            </h4>
                            <p className="mt-1 text-sm text-gray-500">
                              SN: {product.serialNumber}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleProductClick(product, batch);
                              }}
                              className="p-2 text-gray-400 transition-colors rounded-lg hover:text-blue-600 hover:bg-blue-50"
                            >
                              <MoreVertical className="w-5 h-5" />
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQRCodeClick(product);
                              }}
                              className="p-2 text-gray-400 transition-colors rounded-lg hover:text-blue-600 hover:bg-blue-50"
                            >
                              <QrCode className="w-5 h-5" />
                            </button>
                            <Link
                              to={`/manufacturer/track/${product.serialNumber}`}
                              onClick={(e) => e.stopPropagation()}
                              className="p-2 text-gray-400 transition-colors rounded-lg hover:text-blue-600 hover:bg-blue-50"
                            >
                              <Route className="w-5 h-5" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))
        )}
      </div>

      {/* QR Code Modal */}
      <ModalWrapper
        isOpen={showQRModal && selectedProduct}
        onClose={() => setShowQRModal(false)}
        size="md"
        title="Product QR Code"
      >
        {selectedProduct && (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 mb-4 text-green-500">
              <QrCode className="w-full h-full" />
            </div>

            <div className="w-full p-4 mb-4 rounded-lg bg-gray-50">
              <div className="mb-2">
                <p className="text-sm text-gray-600">Serial Number</p>
                <p className="font-mono text-sm break-all">{selectedProduct.serialNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Digital Fingerprint</p>
                <p className="font-mono text-sm break-all">{selectedProduct.fingerprint}</p>
              </div>
            </div>

            <div className="p-4 mb-6 bg-white border rounded-lg">
              <img
                src={selectedProduct.qrCodeUrl}
                alt="Product QR Code"
                className="w-48 h-48 mx-auto"
              />
            </div>

            <div className="flex flex-wrap justify-center gap-4">
              <Button
                variant="secondary"
                className="flex items-center gap-2"
                onClick={() => downloadQRCode(selectedProduct.qrCodeUrl, `QR-${selectedProduct.serialNumber}.png`)}
              >
                <Download className="w-5 h-5" />
                Download QR
              </Button>
              <Button
                variant="secondary"
                className="flex items-center gap-2"
                onClick={() => window.print()}
              >
                <Printer className="w-5 h-5" />
                Print QR
              </Button>
            </div>

            <Button
              variant="primary"
              className="w-full mt-6"
              onClick={() => setShowQRModal(false)}
            >
              Close
            </Button>
          </div>
        )}
      </ModalWrapper>

      {/* Product Details Modal */}
      {showProductModal && selectedProduct && (
        <ProductModal
          product={selectedProduct}
          batch={selectedBatch}
          onClose={() => setShowProductModal(false)}
          onDownloadQR={downloadQRCode}
        />
      )}
      </div>
    </>
  );

// Add the import at the top of the file


// Add the import at the top of the file

};

export default ProductsList;