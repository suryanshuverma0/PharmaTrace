import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  QrCode,
  Download,
  Printer,
  Search,
  Filter,
  Box,
  Calendar,
  Check,
  ChevronDown,
  ChevronUp,
  Boxes,
  Route,
  MoreVertical
} from 'lucide-react';
import ProductModal from '../../components/modals/ProductModal';
import { Input } from '../../components/UI/Input';
import { Button } from '../../components/UI/Button';
import apiClient from '../../services/api/api';

const QRCodeManager = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedBatches, setExpandedBatches] = useState(new Set());
  const [showQRModal, setShowQRModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    const fetchBatches = async () => {
      try {
        setLoading(true);
        // Fetch both batches and manufacturer profile
        const [batchResponse, profileResponse] = await Promise.all([
          apiClient.get('/products/registered-batches'),
          apiClient.get('/manufacturer/profile')
        ]);

        const manufacturerProfile = profileResponse.data;
        const sortedBatches = batchResponse.data
          .map(batch => ({
            ...batch,
            products: batch.products.map(product => ({
              ...product,
              manufactureDate: batch.manufactureDate,
              expiryDate: batch.expiryDate,
              batchNumber: batch.batchNumber,
              productionLocation: manufacturerProfile.address,
              manufacturer: manufacturerProfile.companyName,
              manufacturerCountry: manufacturerProfile.country || 'Nepal',
              manufacturerAddress: manufacturerProfile.address
            }))
          }))
          .sort((a, b) => new Date(b.createdAt || b.manufactureDate) - new Date(a.createdAt || a.manufactureDate));

        setBatches(sortedBatches);
        if (sortedBatches.length > 0) {
          setExpandedBatches(new Set([sortedBatches[0]._id]));
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch batches');
      } finally {
        setLoading(false);
      }
    };
    fetchBatches();
  }, []);

  const toggleBatch = (batchId) => {
    setExpandedBatches(prev => {
      const newSet = new Set(prev);
      if (newSet.has(batchId)) {
        newSet.delete(batchId);
      } else {
        newSet.add(batchId);
      }
      return newSet;
    });
  };

  const handleQRCodeClick = (product) => {
    setSelectedProduct(product);
    setShowQRModal(true);
  };

  const handleProductClick = (product) => {
    // Make sure we have all the required data
    const batch = batches.find(b => b.products.some(p => p._id === product._id));
    if (batch) {
      setSelectedProduct({
        ...product,
        manufactureDate: product.manufactureDate || batch.manufactureDate,
        expiryDate: product.expiryDate || batch.expiryDate,
        batchNumber: product.batchNumber || batch.batchNumber
      });
    } else {
      setSelectedProduct(product);
    }
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

  const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  const handleSearchChange = useCallback(
    debounce((value) => setSearchTerm(value), 300),
    []
  );

  const filteredBatches = batches.filter(batch => {
    const hasMatchingProducts = batch.products?.some(product =>
      product.productName.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const matchesBatchNumber = batch.batchNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' ||
      (filterStatus === 'qr-generated' && batch.products?.some(p => p.qrCodeUrl)) ||
      (filterStatus === 'pending' && batch.products?.some(p => !p.qrCodeUrl));

    return (hasMatchingProducts || matchesBatchNumber) && matchesFilter;
  });

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
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

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">QR Code Manager</h1>
        <p className="mt-2 text-lg text-gray-600">
          Generate and manage QR codes for your pharmaceutical products
        </p>
      </div>

      {/* Filters and Search */}
      <div className="grid gap-4 mb-6 md:flex md:items-center md:justify-between">
        <div className="flex items-center flex-1 gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search by batch number or product name..."
              onChange={(e) => handleSearchChange(e.target.value)}
              icon={<Search className="w-5 h-5" />}
              className="flex-1"
            />
          </div>
          {/* <Select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-48"
            icon={<Filter className="w-5 h-5" />}
          >
            <option value="all">All Status</option>
            <option value="qr-generated">QR Generated</option>
            <option value="pending">Pending Generation</option>
          </Select> */}
        </div>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            className="flex items-center h-10 gap-2"
            onClick={() => setExpandedBatches(new Set(batches.map(b => b._id)))}
          >
            <ChevronDown className="w-5 h-5" />
            Expand All
          </Button>
          <Button
            variant="secondary"
            className="flex items-center h-10 gap-2"
            onClick={() => setExpandedBatches(new Set())}
          >
            <ChevronUp className="w-5 h-5" />
            Collapse All
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="space-y-6">
          {/* Skeleton Batch Cards */}
          {[...Array(3)].map((_, index) => (
            <div key={index} className="overflow-hidden bg-white border shadow-lg rounded-2xl border-gray-200/50">
              {/* Batch Header Skeleton */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex flex-wrap items-start justify-between gap-4 sm:flex-nowrap">
                  <div className="flex items-start flex-1 gap-4">
                    {/* Icon Skeleton */}
                    <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 bg-gray-200 rounded-xl animate-pulse"></div>
                    <div className="flex-1 min-w-0">
                      {/* Batch Title Skeleton */}
                      <div className="flex items-center gap-2">
                        <div className="w-48 h-6 bg-gray-200 rounded animate-pulse"></div>
                        <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                      {/* Batch Details Skeleton */}
                      <div className="mt-2 space-y-2">
                        <div className="flex flex-wrap gap-4">
                          <div className="flex items-center gap-1">
                            <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
                            <div className="w-24 h-4 bg-gray-200 rounded animate-pulse"></div>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
                            <div className="w-24 h-4 bg-gray-200 rounded animate-pulse"></div>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
                            <div className="w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Status Badge Skeleton */}
                  <div className="w-20 h-8 px-4 py-2 bg-gray-200 rounded-full animate-pulse"></div>
                </div>
              </div>

              {/* Products Section Skeleton (only for first batch) */}
              {index === 0 && (
                <div className="p-6 bg-gray-50">
                  <div className="grid grid-cols-1 gap-4">
                    {[...Array(2)].map((_, productIndex) => (
                      <div key={productIndex} className="p-4 bg-white border rounded-xl border-gray-200/50">
                        <div className="flex justify-between">
                          <div className="flex-1 min-w-0">
                            {/* Product Name Skeleton */}
                            <div className="w-40 h-5 bg-gray-200 rounded animate-pulse"></div>
                            {/* Serial Number Skeleton */}
                            <div className="w-32 h-4 mt-2 bg-gray-200 rounded animate-pulse"></div>
                          </div>
                          {/* Action Buttons Skeleton */}
                          <div className="flex items-center gap-2">
                            <div className="bg-gray-200 rounded-lg w-9 h-9 animate-pulse"></div>
                            <div className="bg-gray-200 rounded-lg w-9 h-9 animate-pulse"></div>
                            <div className="bg-gray-200 rounded-lg w-9 h-9 animate-pulse"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="p-6 text-center bg-red-50 rounded-xl">
          <p className="text-red-600">{error}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredBatches.length === 0 ? (
            <div className="p-6 text-center bg-white rounded-xl">
              <p className="text-gray-500">No batches found</p>
            </div>
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
                  className="p-6 border-b border-gray-100 cursor-pointer hover:bg-gray-50"
                  onClick={() => toggleBatch(batch._id)}
                >
                  <div className="flex flex-wrap items-start justify-between gap-4 sm:flex-nowrap">
                    <div className="flex items-start flex-1 gap-4">
                      <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 bg-blue-100 rounded-xl">
                        <Boxes className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div class="flex items-center gap-2">
                          <h3 class="text-lg font-semibold text-gray-900">
                            Batch: {batch.batchNumber}
                          </h3>
                          {expandedBatches.has(batch._id) ? (
                            <ChevronUp className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
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
                              <span>Products: {batch.products?.length || 0}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(batch.status)}`}>
                      {batch.status}
                    </span>
                  </div>
                </div>

                {/* Products Grid */}
                <AnimatePresence>
                  {expandedBatches.has(batch._id) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="p-6 bg-gray-50"
                    >
                      <div className="grid grid-cols-1 gap-4">
                        {batch.products?.map((product) => (
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
                                  onClick={() => handleProductClick(product)}
                                  className="p-2 text-gray-400 transition-colors rounded-lg hover:text-blue-600 hover:bg-blue-50"
                                >
                                  <MoreVertical className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => handleQRCodeClick(product)}
                                  className="p-2 text-gray-400 transition-colors rounded-lg hover:text-blue-600 hover:bg-blue-50"
                                >
                                  <QrCode className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => window.open(`/manufacturer/track/${product.serialNumber}`, '_blank')}
                                  className="p-2 text-gray-400 transition-colors rounded-lg hover:text-blue-600 hover:bg-blue-50"
                                >
                                  <Route className="w-5 h-5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* QR Code Modal */}
      {showQRModal && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md p-6 bg-white rounded-2xl">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 mb-4 text-green-500">
                <QrCode className="w-full h-full" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-gray-900">
                Product QR Code
              </h3>

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
          </div>
        </div>
      )}

      {/* Product Details Modal */}
      {showProductModal && selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setShowProductModal(false)}
          onDownloadQR={downloadQRCode}
        />
      )}
    </div>
  );
};

// Add the import at the top of the file
import ProductDetailsModal from '../../components/modals/ProductDetailsModal';

export default QRCodeManager;
