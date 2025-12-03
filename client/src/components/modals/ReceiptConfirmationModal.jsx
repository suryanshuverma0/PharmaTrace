import React, { useState } from 'react';
import { Button } from '../UI/Button';
import { FaCheckCircle, FaTimes, FaExclamationTriangle, FaBox, FaThermometerHalf } from 'react-icons/fa';

const ReceiptConfirmationModal = ({ 
  batch, 
  isOpen, 
  onClose, 
  onConfirm, 
  isLoading = false 
}) => {
  const [verificationData, setVerificationData] = useState({
    receivedQuantity: batch?.quantity || '',
    environmentalConditions: {
      temperature: '22°C',
      humidity: '60%',
      status: 'Normal'
    },
    qualityCheckNotes: '',
    damageReported: false,
    damageDetails: '',
    verificationDetails: {
      method: 'Manual Count',
      packageIntegrity: 'Good',
      sealStatus: 'Intact'
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!verificationData.receivedQuantity) {
      alert('Please enter the received quantity');
      return;
    }

    if (verificationData.damageReported && !verificationData.damageDetails) {
      alert('Please provide damage details');
      return;
    }

    onConfirm(verificationData);
  };

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setVerificationData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setVerificationData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  if (!isOpen || !batch) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <FaBox className="w-6 h-6 mr-3 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Confirm Receipt</h2>
              <p className="text-sm text-gray-600">Verify and confirm batch delivery</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        {/* Batch Information */}
        <div className="p-4 mb-6 rounded-lg bg-gray-50">
          <h3 className="mb-2 font-semibold text-gray-900">Batch Information</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-600">Product:</span>
              <p className="text-gray-900">{batch.product}</p>
            </div>
            <div>
              <span className="font-medium text-gray-600">Batch ID:</span>
              <p className="text-gray-900">{batch.batchId}</p>
            </div>
            <div>
              <span className="font-medium text-gray-600">Expected Quantity:</span>
              <p className="text-gray-900">{batch.quantity} units</p>
            </div>
            <div>
              <span className="font-medium text-gray-600">From:</span>
              <p className="text-gray-900">{batch.distributor}</p>
            </div>
            <div>
              <span className="font-medium text-gray-600">Expiry Date:</span>
              <p className="text-gray-900">{new Date(batch.expiryDate).toLocaleDateString()}</p>
            </div>
            <div>
              <span className="font-medium text-gray-600">Manufacturer:</span>
              <p className="text-gray-900">{batch.manufacturer}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Quantity Verification */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Received Quantity <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              max={batch.quantity}
              value={verificationData.receivedQuantity}
              onChange={(e) => handleInputChange('receivedQuantity', Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter actual quantity received"
              required
            />
            {verificationData.receivedQuantity !== batch.quantity && verificationData.receivedQuantity !== '' && (
              <div className="flex items-center p-2 mt-2 text-yellow-800 rounded bg-yellow-50">
                <FaExclamationTriangle className="w-4 h-4 mr-2" />
                <span className="text-sm">
                  Quantity discrepancy: Expected {batch.quantity}, entering {verificationData.receivedQuantity}
                </span>
              </div>
            )}
          </div>

          {/* Package Inspection */}
          <div>
            <h3 className="mb-3 font-semibold text-gray-900">Package Inspection</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  Package Integrity
                </label>
                <select
                  value={verificationData.verificationDetails.packageIntegrity}
                  onChange={(e) => handleInputChange('verificationDetails.packageIntegrity', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                  <option value="Damaged">Damaged</option>
                </select>
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  Seal Status
                </label>
                <select
                  value={verificationData.verificationDetails.sealStatus}
                  onChange={(e) => handleInputChange('verificationDetails.sealStatus', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Intact">Intact</option>
                  <option value="Broken">Broken</option>
                  <option value="Missing">Missing</option>
                </select>
              </div>
            </div>
          </div>

          {/* Damage Reporting */}
          <div>
            <div className="flex items-center mb-3">
              <input
                type="checkbox"
                id="damageReported"
                checked={verificationData.damageReported}
                onChange={(e) => handleInputChange('damageReported', e.target.checked)}
                className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
              />
              <label htmlFor="damageReported" className="ml-2 text-sm font-medium text-gray-700">
                Report damage or quality issues
              </label>
            </div>
            {verificationData.damageReported && (
              <textarea
                value={verificationData.damageDetails}
                onChange={(e) => handleInputChange('damageDetails', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                rows="3"
                placeholder="Describe the damage or quality issues in detail..."
                required={verificationData.damageReported}
              />
            )}
          </div>

          {/* Quality Check Notes */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Quality Check Notes
            </label>
            <textarea
              value={verificationData.qualityCheckNotes}
              onChange={(e) => handleInputChange('qualityCheckNotes', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows="3"
              placeholder="Additional notes about the batch condition and quality..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end pt-6 space-x-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className={`${verificationData.damageReported ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-green-600 hover:bg-green-700'}`}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-white rounded-full border-t-transparent animate-spin"></div>
                  Confirming...
                </>
              ) : (
                <>
                  <FaCheckCircle className="w-4 h-4 mr-2" />
                  {verificationData.damageReported ? 'Confirm with Issues' : 'Confirm Receipt'}
                </>
              )}
            </Button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
};

export default ReceiptConfirmationModal;
