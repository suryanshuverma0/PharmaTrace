import React, { useState, useEffect } from 'react';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { FaCheckCircle } from 'react-icons/fa';

const AcknowledgeShipment = () => {
  const [shipments, setShipments] = useState([]);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    // Mock data for shipments to acknowledge
    setShipments([
      { batchId: 'BATCH001', product: 'Paracetamol', quantity: 1000, status: 'In Transit' },
      { batchId: 'BATCH002', product: 'Ibuprofen', quantity: 500, status: 'In Transit' },
    ]);
  }, []);

  const handleAcknowledge = (batchId) => {
    setShipments((prev) =>
      prev.map((s) =>
        s.batchId === batchId ? { ...s, status: 'Received' } : s
      )
    );
    setNotification('Shipment acknowledged!');
    setTimeout(() => setNotification(null), 2000);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-4">Acknowledge Shipments</h2>
      {notification && (
        <div className="p-2 bg-green-100 text-green-800 rounded">{notification}</div>
      )}
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
    </div>
  );
};

export default AcknowledgeShipment;
