import React, { useState, useEffect } from 'react';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { FaCheckCircle } from 'react-icons/fa';
import apiClient from '../../services/api/api';

const AcknowledgeShipment = () => {
  const [shipments, setShipments] = useState([]);
  const [acknowledged, setAcknowledged] = useState([]);
  const [notification, setNotification] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const userRes = await apiClient.get('/auth/me');
      const user = userRes.data.user;
      
      // Get distributor profile for company name
      const profileRes = await apiClient.get('/distributor/profile');
      const companyName = profileRes.data?.distributor?.companyName;
      
      setCurrentUser({ 
        ...user, 
        companyName 
      });
      
      // Now fetch shipments with user info
      fetchShipments(user, companyName);
    } catch (error) {
      console.error('Error fetching current user:', error);
      fetchShipments(); // Fallback without user info
    }
  };

  const fetchShipments = async (user = currentUser, companyName = currentUser?.companyName) => {
    try {
      setLoading(true);
      const res = await apiClient.get('/distributer/batches');
      const all = res.data.batches || [];
      
      // Filter shipments that need acknowledgment vs already acknowledged
      const needsAcknowledgment = [];
      const alreadyAcknowledged = [];
      
      all.forEach(batch => {
        // Check if there are any 'In Transit' shipments TO this distributor that need acknowledgment
        const hasUnacknowledgedShipment = (batch.shipmentHistory || []).some(entry => {
          const isToCurrentDistributor = entry.to === user?.address || 
                                        entry.toAddress === user?.address ||
                                        entry.to === companyName;
          const isInTransit = entry.status === 'In Transit';
          const isFromManufacturer = entry.from !== user?.address && 
                                    entry.from !== companyName &&
                                    entry.fromAddress !== user?.address;
          
          return isToCurrentDistributor && isInTransit && isFromManufacturer;
        });
        
        // Check if distributor has already acknowledged receipt of this batch
        const hasAcknowledgedReceipt = (batch.shipmentHistory || []).some(entry => {
          const isDelivered = entry.status === 'Delivered';
          const hasAckRemark = entry.remarks?.includes('Acknowledged by distributor');
          return isDelivered && hasAckRemark;
        });
        
        if (hasUnacknowledgedShipment && !hasAcknowledgedReceipt) {
          needsAcknowledgment.push(batch);
        } else if (hasAcknowledgedReceipt || batch.status === 'Delivered' || batch.status === 'Received') {
          alreadyAcknowledged.push(batch);
        }
      });
      
      setShipments(needsAcknowledgment);
      setAcknowledged(alreadyAcknowledged);
    } catch (error) {
      console.error('Error fetching shipments:', error);
      setShipments([]);
      setAcknowledged([]);
    } finally {
      setLoading(false);
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
      fetchShipments(currentUser, currentUser?.companyName);
      setTimeout(() => setNotification(null), 2000);
    } catch (error) {
      console.error('Error acknowledging shipment:', error);
      setNotification('Failed to acknowledge shipment: ' + error.message);
      setTimeout(() => setNotification(null), 3000);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="mb-4 text-2xl font-bold">Acknowledge Shipments</h2>
      {notification && (
        <div className="p-2 text-green-800 bg-green-100 rounded">{notification}</div>
      )}
      {loading ? (
        <div className="p-4 text-center text-gray-500 rounded bg-gray-50">
          <div className="animate-pulse">Loading shipments...</div>
        </div>
      ) : shipments.length === 0 ? (
        <div className="p-4 text-center text-gray-500 rounded bg-gray-50">
          No new shipments requiring acknowledgment.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {shipments.map((shipment) => (
            <Card key={shipment.batchId} className="flex flex-col gap-2">
              <div className="font-semibold">Batch ID: {shipment.batchId}</div>
              <div>Product: {shipment.product}</div>
              <div>Total Assigned: {shipment.totalAssignedToDistributor || shipment.quantity}</div>
              <div>Current Available: {shipment.quantity}</div>
              <div>Manufacturer: {shipment.manufacturerName}</div>
              <div>Status: <span className="font-bold text-yellow-600">Awaiting Acknowledgment</span></div>
              
              {/* Show latest shipment entry that needs acknowledgment */}
              {shipment.shipmentHistory && shipment.shipmentHistory.length > 0 && (
                <div className="mt-2 text-sm">
                  <div className="font-semibold">Latest Shipment:</div>
                  {shipment.shipmentHistory
                    .filter(entry => entry.status === 'In Transit')
                    .slice(-1)
                    .map((entry, idx) => (
                      <div key={idx} className="ml-2 text-xs">
                        From: {entry.from} → To: {entry.to}<br/>
                        Quantity: {entry.quantity} | Status: {entry.status}
                      </div>
                    ))
                  }
                </div>
              )}
              
              <Button variant="primary" onClick={() => handleAcknowledge(shipment.batchId)}>
                <FaCheckCircle className="inline mr-1" /> Acknowledge Receipt
              </Button>
            </Card>
          ))}
        </div>
      )}

      {/* Show acknowledged shipments and current inventory */}
      <h3 className="mt-8 text-xl font-semibold">Acknowledged Shipments & Current Inventory</h3>
      {loading ? (
        <div className="p-4 text-center text-gray-400 rounded bg-gray-50">
          <div className="animate-pulse">Loading acknowledged shipments...</div>
        </div>
      ) : acknowledged.length === 0 ? (
        <div className="p-4 text-center text-gray-400 rounded bg-gray-50">No acknowledged shipments yet.</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {acknowledged.map((shipment) => (
            <Card key={shipment.batchId} className="flex flex-col gap-2 border-green-200">
              <div className="font-semibold">Batch ID: {shipment.batchId}</div>
              <div>Product: {shipment.product}</div>
              <div>Total Received: {shipment.totalAssignedToDistributor || shipment.quantity}</div>
              <div>Available Inventory: <span className="font-bold text-blue-600">{shipment.quantity}</span></div>
              <div>Shipped Out: {(shipment.totalAssignedToDistributor || 0) - (shipment.quantity || 0)}</div>
              <div>Status: <span className="font-bold text-green-600">Acknowledged & In Inventory</span></div>
              
              <div className="mt-2">
                <div className="mb-1 font-semibold text-sm">Recent History:</div>
                <div className="max-h-24 overflow-y-auto">
                  <ul className="ml-6 text-xs list-disc space-y-1">
                    {(shipment.shipmentHistory || []).slice(-3).map((h, idx) => (
                      <li key={idx} className={h.status === 'Delivered' ? 'text-green-700' : 'text-gray-600'}>
                        {h.timestamp ? new Date(h.timestamp).toLocaleString() : ''} | {h.from} → {h.to} | Qty: {h.quantity} | <span className={h.status === 'Delivered' ? 'text-green-600' : 'text-yellow-600'}>{h.status}</span> {h.remarks ? `| ${h.remarks}` : ''}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AcknowledgeShipment;
