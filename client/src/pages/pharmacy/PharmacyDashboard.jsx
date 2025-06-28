import React, { useState, useEffect } from 'react';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { FaBox, FaCheckCircle, FaExclamationTriangle, FaQrcode } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const PharmacyDashboard = () => {
  const [incomingBatches, setIncomingBatches] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [expiryAlerts, setExpiryAlerts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Mock incoming batches
    setIncomingBatches([
      { batchId: 'PB001', product: 'Paracetamol', quantity: 200, status: 'In Transit', expiry: '2025-09-01' },
      { batchId: 'PB002', product: 'Ibuprofen', quantity: 100, status: 'In Transit', expiry: '2025-07-15' },
    ]);
    // Mock inventory
    setInventory([
      { batchId: 'PB001', product: 'Paracetamol', quantity: 200, expiry: '2025-09-01' },
      { batchId: 'PB002', product: 'Ibuprofen', quantity: 100, expiry: '2025-07-15' },
    ]);
    // Mock expiry alerts
    setExpiryAlerts([
      { batchId: 'PB002', product: 'Ibuprofen', expiry: '2025-07-15', daysLeft: 17 },
    ]);
  }, []);

  const handleConfirmReceipt = (batchId) => {
    setIncomingBatches((prev) => prev.filter((b) => b.batchId !== batchId));
    // Optionally add to inventory
  };

  return (
    <div className="space-y-8">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card className="bg-blue-50">
          <div className="flex items-center">
            <FaBox className="w-8 h-8 text-blue-500" />
            <div className="ml-4">
              <h3 className="text-lg font-medium">Incoming Batches</h3>
              <p className="text-2xl font-bold">{incomingBatches.length}</p>
            </div>
          </div>
        </Card>
        <Card className="bg-green-50">
          <div className="flex items-center">
            <FaCheckCircle className="w-8 h-8 text-green-500" />
            <div className="ml-4">
              <h3 className="text-lg font-medium">Inventory</h3>
              <p className="text-2xl font-bold">{inventory.reduce((acc, i) => acc + i.quantity, 0)}</p>
            </div>
          </div>
        </Card>
        <Card className="bg-yellow-50">
          <div className="flex items-center">
            <FaExclamationTriangle className="w-8 h-8 text-yellow-500" />
            <div className="ml-4">
              <h3 className="text-lg font-medium">Expiry Alerts</h3>
              <p className="text-2xl font-bold">{expiryAlerts.length}</p>
            </div>
          </div>
        </Card>
        <Card className="cursor-pointer bg-purple-50" onClick={() => navigate('/pharmacy/verify')}>
          <div className="flex items-center">
            <FaQrcode className="w-8 h-8 text-purple-500" />
            <div className="ml-4">
              <h3 className="text-lg font-medium">Product Authenticity</h3>
              <p className="text-2xl font-bold">Scan QR</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Incoming Batches */}
      <Card className="border border-gray-100 shadow">
        <h2 className="flex items-center mb-4 text-lg font-semibold"><FaBox className="mr-2" />Incoming Batches</h2>
        <div className="overflow-x-auto rounded-lg">
          <table className="min-w-full bg-white divide-y divide-gray-200 rounded-lg">
            <thead className="bg-primary-50">
              <tr>
                <th className="px-4 py-2 text-xs font-bold tracking-wider text-left uppercase text-primary-700">Batch ID</th>
                <th className="px-4 py-2 text-xs font-bold tracking-wider text-left uppercase text-primary-700">Product</th>
                <th className="px-4 py-2 text-xs font-bold tracking-wider text-left uppercase text-primary-700">Quantity</th>
                <th className="px-4 py-2 text-xs font-bold tracking-wider text-left uppercase text-primary-700">Expiry</th>
                <th className="px-4 py-2 text-xs font-bold tracking-wider text-left uppercase text-primary-700">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {incomingBatches.map((batch) => (
                <tr key={batch.batchId} className="transition hover:bg-primary-50">
                  <td className="px-4 py-2 font-mono text-sm">{batch.batchId}</td>
                  <td className="px-4 py-2">{batch.product}</td>
                  <td className="px-4 py-2">{batch.quantity}</td>
                  <td className="px-4 py-2">{batch.expiry}</td>
                  <td className="px-4 py-2">
                    <Button size="sm" variant="primary" onClick={() => handleConfirmReceipt(batch.batchId)}>
                      Confirm Receipt
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Inventory Table */}
      <Card className="border border-gray-100 shadow">
        <h2 className="flex items-center mb-4 text-lg font-semibold"><FaCheckCircle className="mr-2" />Inventory</h2>
        <div className="overflow-x-auto rounded-lg">
          <table className="min-w-full bg-white divide-y divide-gray-200 rounded-lg">
            <thead className="bg-primary-50">
              <tr>
                <th className="px-4 py-2 text-xs font-bold tracking-wider text-left uppercase text-primary-700">Batch ID</th>
                <th className="px-4 py-2 text-xs font-bold tracking-wider text-left uppercase text-primary-700">Product</th>
                <th className="px-4 py-2 text-xs font-bold tracking-wider text-left uppercase text-primary-700">Quantity</th>
                <th className="px-4 py-2 text-xs font-bold tracking-wider text-left uppercase text-primary-700">Expiry</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {inventory.map((item) => (
                <tr key={item.batchId} className="transition hover:bg-primary-50">
                  <td className="px-4 py-2 font-mono text-sm">{item.batchId}</td>
                  <td className="px-4 py-2">{item.product}</td>
                  <td className="px-4 py-2">{item.quantity}</td>
                  <td className="px-4 py-2">{item.expiry}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Expiry Alerts */}
      {expiryAlerts.length > 0 && (
        <Card className="border border-yellow-200 shadow bg-yellow-50">
          <h2 className="flex items-center mb-4 text-lg font-semibold text-yellow-700"><FaExclamationTriangle className="mr-2" />Expiry Alerts</h2>
          <ul className="space-y-2">
            {expiryAlerts.map((alert) => (
              <li key={alert.batchId} className="flex items-center gap-4">
                <span className="font-mono text-sm">{alert.batchId}</span>
                <span>{alert.product}</span>
                <span className="text-xs">Expiry: {alert.expiry}</span>
                <span className="text-xs font-bold text-yellow-800">{alert.daysLeft} days left</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
};

export default PharmacyDashboard;
