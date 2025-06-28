import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { Select } from '../../components/UI/Select';
import Alert from '../../components/UI/Alert';
import { FaBox, FaTruck, FaCheckCircle, FaShippingFast, FaWarehouse, FaShareSquare, FaHistory } from 'react-icons/fa';

const DistributorDashboard = () => {
  const [products, setProducts] = useState([]);
  const [batches, setBatches] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [selectedPharmacy, setSelectedPharmacy] = useState('');
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  // Mock pharmacy list - Replace with actual data from smart contract
  const pharmacies = [
    { value: '0x123...', label: 'Pharmacy A' },
    { value: '0x456...', label: 'Pharmacy B' },
    { value: '0x789...', label: 'Pharmacy C' },
  ];

  useEffect(() => {
    // Fetch products assigned to distributor
    fetchProducts();
    // Mock assigned batches
    setBatches([
      { batchId: 'BATCH001', product: 'Paracetamol', quantity: 1000, status: 'In Transit', manufacturer: '0xabc...' },
      { batchId: 'BATCH002', product: 'Ibuprofen', quantity: 500, status: 'Delivered', manufacturer: '0xdef...' },
    ]);
    // Mock inventory
    setInventory([
      { batchId: 'BATCH001', product: 'Paracetamol', quantity: 800, total: 1000, status: 'Ready' },
      { batchId: 'BATCH002', product: 'Ibuprofen', quantity: 500, total: 500, status: 'Ready' },
    ]);
    // Mock transfer history
    setTransfers([
      {
        batchId: 'BATCH001',
        product: 'Paracetamol',
        total: 1000,
        left: 600,
        distributions: [
          { pharmacy: 'Pharmacy A', quantity: 200, status: 'Delivered' },
          { pharmacy: 'Pharmacy B', quantity: 200, status: 'In Transit' },
        ],
      },
      {
        batchId: 'BATCH002',
        product: 'Ibuprofen',
        total: 500,
        left: 500,
        distributions: [],
      },
    ]);
  }, []);

  const fetchProducts = async () => {
    // TODO: Replace with actual smart contract call
    const mockProducts = [
      {
        serialNumber: 'SN001',
        name: 'Product A',
        manufacturer: '0xabc...',
        status: 'Manufactured',
      },
      {
        serialNumber: 'SN002',
        name: 'Product B',
        manufacturer: '0xdef...',
        status: 'At Distributor',
      },
    ];
    setProducts(mockProducts);
  };

  const handleReceiveProduct = async (serialNumber) => {
    try {
      // TODO: Call smart contract method to update product status
      setNotification({
        show: true,
        message: 'Product received successfully',
        type: 'success',
      });
      // Refresh products list
      fetchProducts();
    } catch (error) {
      setNotification({
        show: true,
        message: 'Failed to receive product',
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
      // TODO: Call smart contract method to update product status and assign to pharmacy
      setNotification({
        show: true,
        message: 'Product shipped successfully',
        type: 'success',
      });
      // Refresh products list
      fetchProducts();
    } catch (error) {
      setNotification({
        show: true,
        message: 'Failed to ship product',
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
      <Card className="shadow-lg border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
          <h2 className="text-lg font-semibold flex items-center text-primary-700"><FaShippingFast className="mr-2 text-primary-500" />Assigned Batches</h2>
          <input
            type="text"
            placeholder="Search by product or batch..."
            className="border border-primary-200 focus:ring-primary-400 focus:border-primary-400 rounded px-3 py-1 w-full md:w-64 transition"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="overflow-x-auto rounded-lg">
          <table className="min-w-full divide-y divide-gray-200 bg-white rounded-lg">
            <thead className="bg-primary-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-bold text-primary-700 uppercase tracking-wider">Batch ID</th>
                <th className="px-4 py-2 text-left text-xs font-bold text-primary-700 uppercase tracking-wider">Product</th>
                <th className="px-4 py-2 text-left text-xs font-bold text-primary-700 uppercase tracking-wider">Quantity</th>
                <th className="px-4 py-2 text-left text-xs font-bold text-primary-700 uppercase tracking-wider">Status</th>
                <th className="px-4 py-2 text-left text-xs font-bold text-primary-700 uppercase tracking-wider">Manufacturer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {batches.filter(batch =>
                batch.product.toLowerCase().includes(search.toLowerCase()) ||
                batch.batchId.toLowerCase().includes(search.toLowerCase())
              ).map((batch) => (
                <tr key={batch.batchId} className="hover:bg-primary-50 transition">
                  <td className="px-4 py-2 font-mono text-sm">{batch.batchId}</td>
                  <td className="px-4 py-2">{batch.product}</td>
                  <td className="px-4 py-2">{batch.quantity}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${batch.status === 'In Transit' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>{batch.status}</span>
                  </td>
                  <td className="px-4 py-2 font-mono text-xs">{batch.manufacturer.slice(0, 8)}...</td>
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
