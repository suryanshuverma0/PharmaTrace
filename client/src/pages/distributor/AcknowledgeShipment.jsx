import React, { useState, useEffect } from 'react';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { FaCheckCircle } from 'react-icons/fa';
import apiClient from '../../services/api/api';

const AcknowledgeShipment = () => {
  const [shipments, setShipments] = useState([]);
  const [acknowledged, setAcknowledged] = useState([]);
  const [notification, setNotification] = useState(null);


  useEffect(() => {
    fetchShipments();
  }, []);

  const fetchShipments = async () => {
    try {
      const res = await apiClient.get('/distributer/batches');
      const all = res.data.batches || [];
      setShipments(all.filter(b => b.status === 'In Transit'));
      setAcknowledged(all.filter(b => b.status === 'Delivered' || b.status === 'Received'));
    } catch (error) {
      setShipments([]);
      setAcknowledged([]);
    }
  };

  const handleAcknowledge = async (batchId) => {
    try {
      // Use serialNumber directly from the shipment if available
      const shipment = shipments.find(s => s.batchId === batchId);
      const serialNumber = shipment && shipment.serialNumber;
      if (!serialNumber) throw new Error('No serial number found for this batch');
      await apiClient.post('/distributer/receive', { serialNumber });
      setNotification('Shipment acknowledged!');
      fetchShipments();
      setTimeout(() => setNotification(null), 2000);
    } catch (error) {
      setNotification('Failed to acknowledge shipment');
      setTimeout(() => setNotification(null), 2000);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-4">Acknowledge Shipments</h2>
      {notification && (
        <div className="p-2 bg-green-100 text-green-800 rounded">{notification}</div>
      )}
      {shipments.length === 0 ? (
        <div className="p-4 text-center text-gray-500 bg-gray-50 rounded">No shipments to acknowledge.</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {shipments.map((shipment) => (
            <Card key={shipment.batchId} className="flex flex-col gap-2">
              <div className="font-semibold">Batch ID: {shipment.batchId}</div>
              <div>Product: {shipment.product}</div>
              <div>Quantity: {shipment.quantity}</div>
              <div>Status: <span className={`font-bold ${shipment.status === 'Received' ? 'text-green-600' : 'text-yellow-600'}`}>{shipment.status}</span></div>
              {shipment.status === 'In Transit' && (
                <Button variant="primary" onClick={() => handleAcknowledge(shipment.batchId)}>
                  <FaCheckCircle className="inline mr-1" /> Mark as Received
                </Button>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Show acknowledged shipments */}
      <h3 className="text-xl font-semibold mt-8">Acknowledged Shipments</h3>
      {acknowledged.length === 0 ? (
        <div className="p-4 text-center text-gray-400 bg-gray-50 rounded">No acknowledged shipments yet.</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {acknowledged.map((shipment) => (
            <Card key={shipment.batchId} className="flex flex-col gap-2 opacity-70">
              <div className="font-semibold">Batch ID: {shipment.batchId}</div>
              <div>Product: {shipment.product}</div>
              <div>Quantity: {shipment.quantity}</div>
              <div>Status: <span className="font-bold text-green-600">{shipment.status}</span></div>
              <div className="mt-2">
                <div className="font-semibold mb-1">Shipment History:</div>
                <ul className="list-disc ml-6 text-xs">
                  {(shipment.shipmentHistory || []).map((h, idx) => (
                    <li key={idx}>
                      {h.timestamp ? new Date(h.timestamp).toLocaleString() : ''} | {h.from} → {h.to} | Qty: {h.quantity} | <span className={h.status === 'Delivered' ? 'text-green-600' : 'text-yellow-600'}>{h.status}</span> {h.remarks ? `| ${h.remarks}` : ''}
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AcknowledgeShipment;
