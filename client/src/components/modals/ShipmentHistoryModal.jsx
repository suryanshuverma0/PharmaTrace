import React, { useState } from 'react';
import { FaTimes, FaCheckCircle, FaTruck, FaWarehouse, FaExclamationTriangle, FaUser, FaThermometerHalf, FaClock } from 'react-icons/fa';
import { Button } from '../UI/Button';

const ShipmentHistoryModal = ({ batch, isOpen, onClose }) => {
  const [selectedEntry, setSelectedEntry] = useState(null);

  if (!isOpen || !batch) return null;

  const getStatusIcon = (status) => {
    const statusLower = status?.toLowerCase() || '';
    if (statusLower.includes('produced') || statusLower.includes('manufactured')) return <FaWarehouse className="w-4 h-4 text-blue-600" />;
    if (statusLower.includes('transit') || statusLower.includes('shipped')) return <FaTruck className="w-4 h-4 text-yellow-600" />;
    if (statusLower.includes('delivered') || statusLower.includes('received')) return <FaCheckCircle className="w-4 h-4 text-green-600" />;
    return <FaClock className="w-4 h-4 text-gray-600" />;
  };

  const getStatusColor = (status) => {
    const statusLower = status?.toLowerCase() || '';
    if (statusLower.includes('produced') || statusLower.includes('manufactured')) return 'bg-blue-50 border-blue-200';
    if (statusLower.includes('transit') || statusLower.includes('shipped')) return 'bg-yellow-50 border-yellow-200';
    if (statusLower.includes('delivered') || statusLower.includes('received')) return 'bg-green-50 border-green-200';
    return 'bg-gray-50 border-gray-200';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-4xl p-6 mx-4 bg-white rounded-lg shadow-xl max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <FaTruck className="w-6 h-6 mr-3 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Shipment History</h2>
              <p className="text-sm text-gray-600">Complete traceability log for batch {batch.batchId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        {/* Batch Summary */}
        <div className="p-4 mb-6 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-600">Product:</span>
              <p className="text-gray-900">{batch.product}</p>
            </div>
            <div>
              <span className="font-medium text-gray-600">Quantity:</span>
              <p className="text-gray-900">{batch.quantity} units</p>
            </div>
            <div>
              <span className="font-medium text-gray-600">Current Status:</span>
              <p className="text-gray-900 capitalize">{batch.status}</p>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-4">
          {batch.shipmentHistory?.length > 0 ? (
            batch.shipmentHistory.map((entry, index) => (
              <div key={index} className={`border rounded-lg p-4 ${getStatusColor(entry.status)}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    {getStatusIcon(entry.status)}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-medium text-gray-900">{entry.status}</h3>
                        <span className="text-sm text-gray-500">
                          {new Date(entry.timestamp).toLocaleString()}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><span className="font-medium">From:</span> {entry.from || 'N/A'}</p>
                        <p><span className="font-medium">To:</span> {entry.to || 'N/A'}</p>
                        <p><span className="font-medium">Quantity:</span> {entry.quantity} units</p>
                        {entry.remarks && (
                          <p><span className="font-medium">Remarks:</span> {entry.remarks}</p>
                        )}
                      </div>

                      {/* Actor Information */}
                      {entry.actor && (
                        <div className="mt-2 p-2 bg-white bg-opacity-50 rounded text-sm">
                          <p className="flex items-center">
                            <FaUser className="w-3 h-3 mr-1" />
                            <span className="font-medium">Actor:</span> {entry.actor.name} ({entry.actor.type})
                          </p>
                          {entry.actor.license && (
                            <p><span className="font-medium">License:</span> {entry.actor.license}</p>
                          )}
                        </div>
                      )}

                      {/* Environmental Conditions */}
                      {entry.environmentalConditions && (
                        <div className="mt-2 p-2 bg-white bg-opacity-50 rounded text-sm">
                          <p className="flex items-center mb-1">
                            <FaThermometerHalf className="w-3 h-3 mr-1" />
                            <span className="font-medium">Environmental Conditions:</span>
                          </p>
                          <div className="grid grid-cols-3 gap-2">
                            <p>Temp: {entry.environmentalConditions.temperature || 'N/A'}</p>
                            <p>Humidity: {entry.environmentalConditions.humidity || 'N/A'}</p>
                            <p>Status: {entry.environmentalConditions.status || 'N/A'}</p>
                          </div>
                        </div>
                      )}

                      {/* Quality Check */}
                      {entry.qualityCheck && (
                        <div className="mt-2 p-2 bg-white bg-opacity-50 rounded text-sm">
                          <div className="flex items-center mb-1">
                            {entry.qualityCheck.result === 'Pass' ? 
                              <FaCheckCircle className="w-3 h-3 mr-1 text-green-600" /> :
                              <FaExclamationTriangle className="w-3 h-3 mr-1 text-red-600" />
                            }
                            <span className="font-medium">Quality Check:</span> {entry.qualityCheck.result}
                          </div>
                          <p><span className="font-medium">Performed by:</span> {entry.qualityCheck.performedBy}</p>
                          {entry.qualityCheck.notes && (
                            <p><span className="font-medium">Notes:</span> {entry.qualityCheck.notes}</p>
                          )}
                          {entry.qualityCheck.damageReported && (
                            <div className="mt-1 p-1 bg-red-50 border border-red-200 rounded">
                              <p className="text-red-800"><span className="font-medium">Damage Reported:</span> {entry.qualityCheck.damageDetails}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Verification Details (for pharmacy confirmations) */}
                      {entry.verification && (
                        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                          <p className="font-medium text-blue-800 mb-1">Verification Details</p>
                          <p><span className="font-medium">Verified by:</span> {entry.verification.verifiedBy?.name} ({entry.verification.verifiedBy?.role})</p>
                          <p><span className="font-medium">License:</span> {entry.verification.verifiedBy?.license}</p>
                          <p><span className="font-medium">Digital Signature:</span> {entry.verification.digitalSignature}</p>
                          {entry.verification.receiptConfirmed && (
                            <p className="text-green-600 font-medium">✓ Receipt Confirmed</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Details Button */}
                  {(entry.actor || entry.environmentalConditions || entry.qualityCheck) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedEntry(selectedEntry === index ? null : index)}
                      className="ml-4"
                    >
                      {selectedEntry === index ? 'Hide' : 'Details'}
                    </Button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FaTruck className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No shipment history available</p>
            </div>
          )}
        </div>

        {/* Close Button */}
        <div className="flex justify-end mt-6 pt-4 border-t">
          <Button onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ShipmentHistoryModal;
