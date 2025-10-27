import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { Select } from '../../components/UI/Select';
import Alert from '../../components/UI/Alert';
import { FaBox, FaTruck, FaCheckCircle, FaShippingFast, FaWarehouse, FaShareSquare, FaHistory } from 'react-icons/fa';
import apiClient from '../../services/api/api';

const DistributorDashboard = () => {
  const [products, setProducts] = useState([]);
  const [batches, setBatches] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [selectedPharmacy, setSelectedPharmacy] = useState('');
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Mock pharmacy list - Replace with actual data from smart contract
  const pharmacies = [
    { value: '0x123...', label: 'Pharmacy A' },
    { value: '0x456...', label: 'Pharmacy B' },
    { value: '0x789...', label: 'Pharmacy C' },
  ];

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Fetch products assigned to distributor
      const productsRes = await apiClient.get('/distributer/products');
      setProducts(productsRes.data.products || []);

      // Fetch assigned batches
      const batchesRes = await apiClient.get('/distributer/batches');
      setBatches(batchesRes.data.batches || []);

      // Fetch inventory
      const inventoryRes = await apiClient.get('/distributer/inventory');
      setInventory(inventoryRes.data.inventory || []);

      // Fetch transfer/distribution history
      const transfersRes = await apiClient.get('/distributer/transfers');
      setTransfers(transfersRes.data.transfers || []);
    } catch (error) {
      setNotification({ show: true, message: 'Failed to fetch dashboard data', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Deprecated: fetchProducts is now handled in fetchDashboardData

  const handleReceiveProduct = async (serialNumber) => {
    try {
      await apiClient.post(`/distributor/receive`, { serialNumber });
      setNotification({
        show: true,
        message: 'Product received successfully',
        type: 'success',
      });
      fetchDashboardData();
    } catch (error) {
      setNotification({
        show: true,
        message: error?.response?.data?.message || 'Failed to receive product',
        type: 'error',
      });
    }
  };

  const handleShipToPharmacy = async (serialNumber) => {
    if (!selectedPharmacy) {
      setNotification({
        show: true,
        message: 'Please select a pharmacy',
        type: 'error',
      });
      return;
    }
    try {
      await apiClient.post(`/distributor/ship`, { serialNumber, pharmacy: selectedPharmacy });
      setNotification({
        show: true,
        message: 'Product shipped successfully',
        type: 'success',
      });
      fetchDashboardData();
    } catch (error) {
      setNotification({
        show: true,
        message: error?.response?.data?.message || 'Failed to ship product',
        type: 'error',
      });
    }
  };

  const handleTrackProduct = (serialNumber) => {
    navigate(`/distributor/track?serial=${serialNumber}`);
  };

  const handleVerifyProduct = () => {
    navigate('/distributor/verify');
  };

  // Skeleton components
  const StatCardSkeleton = () => (
    <Card className="bg-gray-50">
      <div className="flex items-center">
        <div className="w-8 h-8 bg-gray-300 rounded animate-pulse"></div>
        <div className="ml-4">
          <div className="w-24 h-4 mb-2 bg-gray-300 rounded animate-pulse"></div>
          <div className="w-16 h-6 bg-gray-300 rounded animate-pulse"></div>
        </div>
      </div>
    </Card>
  );

  const TableSkeleton = () => (
    <Card className="border border-gray-100 shadow-lg">
      <div className="flex flex-col gap-4 mb-4 md:flex-row md:items-center md:justify-between">
        <div className="w-48 h-6 bg-gray-300 rounded animate-pulse"></div>
        <div className="w-64 h-8 bg-gray-300 rounded animate-pulse"></div>
      </div>
      <div className="overflow-x-auto rounded-lg">
        <table className="min-w-full bg-white divide-y divide-gray-200 rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              {Array.from({ length: 7 }).map((_, index) => (
                <th key={index} className="px-4 py-2">
                  <div className="w-20 h-4 bg-gray-300 rounded animate-pulse"></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {Array.from({ length: 5 }).map((_, rowIndex) => (
              <tr key={rowIndex}>
                {Array.from({ length: 7 }).map((_, colIndex) => (
                  <td key={colIndex} className="px-4 py-2">
                    <div className={`bg-gray-300 rounded animate-pulse ${
                      colIndex === 0 ? 'w-24 h-4' : 
                      colIndex === 1 ? 'w-32 h-4' :
                      colIndex === 5 ? 'w-16 h-6' : 'w-16 h-4'
                    }`}></div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );

  if (loading) {
    return (
      <div className="space-y-8">
        {/* Overview Cards Skeleton */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <StatCardSkeleton key={index} />
          ))}
        </div>

        {/* Table Skeleton */}
        <TableSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {notification.show && (
        <Alert
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification({ show: false })}
        />
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
        <Card className="bg-blue-50">
          <div className="flex items-center">
            <FaBox className="w-8 h-8 text-blue-500" />
            <div className="ml-4">
              <h3 className="text-lg font-medium">Total Products</h3>
              <p className="text-2xl font-bold">{products.length}</p>
            </div>
          </div>
        </Card>
        <Card className="bg-yellow-50">
          <div className="flex items-center">
            <FaShippingFast className="w-8 h-8 text-yellow-500" />
            <div className="ml-4">
              <h3 className="text-lg font-medium">Assigned Batches</h3>
              <p className="text-2xl font-bold">{batches.length}</p>
            </div>
          </div>
        </Card>
        <Card className="bg-green-50">
          <div className="flex items-center">
            <FaTruck className="w-8 h-8 text-green-500" />
            <div className="ml-4">
              <h3 className="text-lg font-medium">In Transit</h3>
              <p className="text-2xl font-bold">{batches.filter((b) => b.status === 'In Transit').length}</p>
            </div>
          </div>
        </Card>
        <Card className="bg-purple-50">
          <div className="flex items-center">
            <FaCheckCircle className="w-8 h-8 text-purple-500" />
            <div className="ml-4">
              <h3 className="text-lg font-medium">Delivered</h3>
              <p className="text-2xl font-bold">{batches.filter((b) => b.status === 'Delivered').length}</p>
            </div>
          </div>
        </Card>
        <Card className="bg-gray-50">
          <div className="flex items-center">
            <FaWarehouse className="w-8 h-8 text-gray-500" />
            <div className="ml-4">
              <h3 className="text-lg font-medium">Inventory</h3>
              <p className="text-2xl font-bold">{inventory.reduce((acc, i) => acc + i.quantity, 0)}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Assigned Batches Table */}
      <Card className="border border-gray-100 shadow-lg">
        <div className="flex flex-col gap-4 mb-4 md:flex-row md:items-center md:justify-between">
          <h2 className="flex items-center text-lg font-semibold text-primary-700"><FaShippingFast className="mr-2 text-primary-500" />Assigned Batches</h2>
          <input
            type="text"
            placeholder="Search by product or batch..."
            className="w-full px-3 py-1 transition border rounded border-primary-200 focus:ring-primary-400 focus:border-primary-400 md:w-64"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="overflow-x-auto rounded-lg">
          <table className="min-w-full bg-white divide-y divide-gray-200 rounded-lg">
            <thead className="bg-primary-50">
              <tr>
                <th className="px-4 py-2 text-xs font-bold tracking-wider text-left uppercase text-primary-700">Batch ID</th>
                <th className="px-4 py-2 text-xs font-bold tracking-wider text-left uppercase text-primary-700">Product</th>
                <th className="px-4 py-2 text-xs font-bold tracking-wider text-left uppercase text-primary-700">Remaining</th>
                <th className="px-4 py-2 text-xs font-bold tracking-wider text-left uppercase text-primary-700">Assigned</th>
                <th className="px-4 py-2 text-xs font-bold tracking-wider text-left uppercase text-primary-700">Shipped Out</th>
                <th className="px-4 py-2 text-xs font-bold tracking-wider text-left uppercase text-primary-700">Status</th>
                <th className="px-4 py-2 text-xs font-bold tracking-wider text-left uppercase text-primary-700">Manufacturer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {batches.filter(batch =>
                batch.product.toLowerCase().includes(search.toLowerCase()) ||
                batch.batchId.toLowerCase().includes(search.toLowerCase())
              ).map((batch) => (
                <tr key={batch.batchId} className="transition hover:bg-primary-50">
                  <td className="px-4 py-2 font-mono text-sm">{batch.batchId}</td>
                  <td className="px-4 py-2">{batch.product}</td>
                  <td className="px-4 py-2">{batch.quantity ?? batch.remainingQuantity ?? 0}</td>
                  <td className="px-4 py-2">{batch.totalAssignedToDistributor ?? batch.totalAssigned ?? '-'}</td>
                  <td className="px-4 py-2">{batch.shippedOutByDistributor ?? 0}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${batch.status === 'In Transit' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>{batch.status}</span>
                  </td>
                  <td className="px-4 py-2 text-sm">{batch.manufacturerName || 'Unknown Manufacturer'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Distribution History section removed as requested */}
    </div>
  );
};

export default DistributorDashboard;
