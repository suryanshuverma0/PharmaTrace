import React, { useState, useEffect } from 'react';
import { Card } from '../../components/UI/Card';
import { FaExclamationTriangle } from 'react-icons/fa';

const ExpiryAlerts = () => {
  const [expiryAlerts, setExpiryAlerts] = useState([]);

  useEffect(() => {
    // Mock expiry alerts data
    setExpiryAlerts([
      { batchId: 'PB002', product: 'Ibuprofen', expiry: '2025-07-15', daysLeft: 17 },
      { batchId: 'PB003', product: 'Aspirin', expiry: '2025-07-20', daysLeft: 22 },
      { batchId: 'PB004', product: 'Cetirizine', expiry: '2025-08-01', daysLeft: 34 },
    ]);
  }, []);

  return (
    <div className="space-y-8">
      <Card className="shadow border border-yellow-200 bg-yellow-50">
        <h2 className="text-lg font-semibold mb-4 flex items-center text-yellow-700">
          <FaExclamationTriangle className="mr-2" />Expiry Alerts
        </h2>
        {expiryAlerts.length === 0 ? (
          <div className="text-gray-500">No medicines expiring soon.</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 bg-yellow-50 rounded-lg">
            <thead className="bg-yellow-100">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-bold text-yellow-800 uppercase tracking-wider">Batch ID</th>
                <th className="px-4 py-2 text-left text-xs font-bold text-yellow-800 uppercase tracking-wider">Product</th>
                <th className="px-4 py-2 text-left text-xs font-bold text-yellow-800 uppercase tracking-wider">Expiry Date</th>
                <th className="px-4 py-2 text-left text-xs font-bold text-yellow-800 uppercase tracking-wider">Days Left</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-yellow-100">
              {expiryAlerts.map((alert) => (
                <tr key={alert.batchId} className="hover:bg-yellow-100 transition">
                  <td className="px-4 py-2 font-mono text-sm">{alert.batchId}</td>
                  <td className="px-4 py-2">{alert.product}</td>
                  <td className="px-4 py-2">{alert.expiry}</td>
                  <td className="px-4 py-2 font-bold text-yellow-800">{alert.daysLeft} days</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
};

export default ExpiryAlerts;
