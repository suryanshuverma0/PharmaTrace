import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle,
  Package,
  Truck,
  Calendar,
  Building2,
  Hash
} from 'lucide-react';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
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
        console.log('Processing batch:', batch.batchId, 'Status:', batch.status);
        console.log('User info:', { address: user?.address, companyName });
        
        // Check if there are any 'In Transit' shipments TO this distributor that need acknowledgment
        const hasUnacknowledgedShipment = (batch.shipmentHistory || []).some(entry => {
          console.log('Checking shipment entry:', entry);
          
          const isToCurrentDistributor = entry.to === user?.address || 
                                        entry.toAddress === user?.address ||
                                        entry.to === companyName ||
                                        entry.toAddress?.toLowerCase() === user?.address?.toLowerCase();
          
          const isInTransit = entry.status === 'In Transit';
          const isFromManufacturer = entry.actor?.type === 'Manufacturer' || 
                                    entry.verifiedBy?.role === 'Manufacturer' ||
                                    (entry.from !== user?.address && 
                                     entry.from !== companyName &&
                                     entry.fromAddress !== user?.address);
          
          console.log('Shipment check:', {
            isToCurrentDistributor,
            isInTransit,
            isFromManufacturer,
            to: entry.to,
            toAddress: entry.toAddress,
            status: entry.status
          });
          
          return isToCurrentDistributor && isInTransit && isFromManufacturer;
        });
        
        // Simplified acknowledgment check - if batch status is 'In Transit', it needs acknowledgment
        const batchNeedsAcknowledgment = batch.status === 'In Transit';
        
        // Check if distributor has already acknowledged receipt of this batch
        const hasAcknowledgedReceipt = (batch.shipmentHistory || []).some(entry => {
          const isDelivered = entry.status === 'Delivered' || entry.status === 'Received';
          const hasAckRemark = entry.remarks?.includes('Acknowledged by distributor') || 
                              entry.remarks?.includes('acknowledged') ||
                              entry.remarks?.includes('received');
          return isDelivered || hasAckRemark;
        }) || batch.status === 'Delivered' || batch.status === 'Received';
        
        console.log('Batch decision:', {
          batchId: batch.batchId,
          hasUnacknowledgedShipment,
          batchNeedsAcknowledgment,
          hasAcknowledgedReceipt
        });
        
        if ((hasUnacknowledgedShipment || batchNeedsAcknowledgment) && !hasAcknowledgedReceipt) {
          needsAcknowledgment.push(batch);
        } else if (hasAcknowledgedReceipt) {
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
    <div className="min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Acknowledge Shipments</h1>
        <p className="mt-2 text-lg text-gray-600">
          Review and acknowledge incoming shipments from manufacturers
        </p>
      </div>

      {notification && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 mb-6 rounded-xl ${
            notification.includes('Failed') 
              ? 'bg-red-100 text-red-800 border border-red-200'
              : 'bg-green-100 text-green-800 border border-green-200'
          }`}
        >
          {notification}
        </motion.div>
      )}
      {loading ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {[...Array(2)].map((_, index) => (
            <div key={index} className="p-6 bg-white border shadow-lg rounded-2xl border-gray-200/50">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded-xl animate-pulse"></div>
                <div className="flex-1 space-y-3">
                  <div className="w-32 h-5 bg-gray-200 rounded animate-pulse"></div>
                  <div className="w-48 h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="w-40 h-4 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
              <div className="w-full h-10 mt-6 bg-gray-200 rounded-lg animate-pulse"></div>
            </div>
          ))}
        </div>
      ) : shipments.length === 0 ? (
        <div className="p-8 text-center bg-white border shadow-lg rounded-2xl border-gray-200/50">
          <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900">No Pending Shipments</h3>
          <p className="mt-2 text-gray-600">All shipments have been acknowledged</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {shipments.map((shipment, index) => (
            <motion.div
              key={shipment.batchId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-6 transition-all duration-200 bg-white border shadow-lg rounded-2xl border-gray-200/50 hover:shadow-xl"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="flex items-center justify-center w-12 h-12 bg-amber-100 rounded-xl">
                  <Truck className="w-6 h-6 text-amber-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Hash className="w-4 h-4 text-gray-400" />
                    <span className="font-semibold text-gray-900">{shipment.batchId}</span>
                  </div>
                  <h3 className="mb-1 text-lg font-semibold text-gray-900">{shipment.product}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Building2 className="w-4 h-4" />
                    <span>{shipment.manufacturerName}</span>
                  </div>
                </div>
                <div className="px-3 py-1 text-sm font-medium rounded-full text-amber-800 bg-amber-100">
                  Pending
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-3 text-center rounded-lg bg-gray-50">
                  <div className="text-2xl font-bold text-blue-600">{shipment.quantity}</div>
                  <div className="text-sm text-gray-600">Available Quantity</div>
                </div>
                <div className="p-3 text-center rounded-lg bg-gray-50">
                  <div className="text-2xl font-bold text-green-600">{shipment.totalAssignedToDistributor || shipment.quantity}</div>
                  <div className="text-sm text-gray-600">Total Assigned</div>
                </div>
              </div>
              
              <Button 
                variant="primary" 
                onClick={() => handleAcknowledge(shipment.batchId)}
                className="flex items-center justify-center w-full gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                Acknowledge Receipt
              </Button>
            </motion.div>
          ))}
        </div>
      )}

      {/* Acknowledged Shipments */}
      <div className="mt-12">
        <h2 className="mb-2 text-2xl font-bold text-gray-900">Inventory Overview</h2>
        <p className="mb-6 text-gray-600">Your acknowledged shipments and current stock levels</p>
      </div>
      {loading ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {[...Array(2)].map((_, index) => (
            <div key={index} className="p-6 bg-white border shadow-lg rounded-2xl border-gray-200/50">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded-xl animate-pulse"></div>
                <div className="flex-1 space-y-3">
                  <div className="w-32 h-5 bg-gray-200 rounded animate-pulse"></div>
                  <div className="w-48 h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="h-16 bg-gray-200 rounded-lg animate-pulse"></div>
                    <div className="h-16 bg-gray-200 rounded-lg animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : acknowledged.length === 0 ? (
        <div className="p-8 text-center bg-white border shadow-lg rounded-2xl border-gray-200/50">
          <CheckCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900">No Inventory Yet</h3>
          <p className="mt-2 text-gray-600">Acknowledged shipments will appear here</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {acknowledged.map((shipment, index) => (
            <motion.div
              key={shipment.batchId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-6 transition-all duration-200 bg-white border shadow-lg rounded-2xl border-gray-200/50 hover:shadow-xl"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-xl">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Hash className="w-4 h-4 text-gray-400" />
                    <span className="font-semibold text-gray-900">{shipment.batchId}</span>
                  </div>
                  <h3 className="mb-1 text-lg font-semibold text-gray-900">{shipment.product}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Building2 className="w-4 h-4" />
                    <span>{shipment.manufacturerName}</span>
                  </div>
                </div>
                <div className="px-3 py-1 text-sm font-medium text-green-800 bg-green-100 rounded-full">
                  In Stock
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 text-center rounded-lg bg-blue-50">
                  <div className="text-2xl font-bold text-blue-600">{shipment.quantity}</div>
                  <div className="text-sm text-gray-600">Available</div>
                </div>
                <div className="p-3 text-center rounded-lg bg-gray-50">
                  <div className="text-2xl font-bold text-gray-600">{(shipment.totalAssignedToDistributor || 0) - (shipment.quantity || 0)}</div>
                  <div className="text-sm text-gray-600">Distributed</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AcknowledgeShipment;
