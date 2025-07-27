import React from 'react';
import { FaCheckCircle, FaTimesCircle, FaThermometerHalf, FaTint } from 'react-icons/fa';
import { Card } from '../UI/Card';

const JourneyDetails = ({ product, shipmentHistory }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Product Information */}
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-3">Product Information</h3>
          <div className="space-y-2">
            <p><span className="font-medium">Name:</span> {product.productName}</p>
            <p><span className="font-medium">Serial Number:</span> {product.serialNumber}</p>
            <p><span className="font-medium">Batch Number:</span> {product.batchNumber}</p>
            <p><span className="font-medium">Manufacturer:</span> {product.manufacturerName}</p>
            <p><span className="font-medium">Manufacturing Date:</span> {new Date(product.manufactureDate).toLocaleDateString()}</p>
            <p><span className="font-medium">Expiry Date:</span> {new Date(product.expiryDate).toLocaleDateString()}</p>
            <p><span className="font-medium">Pack Size:</span> {product.packSize}</p>
          </div>
        </Card>

        {/* Regulatory Information */}
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-3">Regulatory Information</h3>
          <div className="space-y-2">
            <p><span className="font-medium">License Number:</span> {product.regulatoryInfo?.licenseNumber}</p>
            <p><span className="font-medium">Issued By:</span> {product.regulatoryInfo?.issuedBy}</p>
            <p><span className="font-medium">Issue Date:</span> {product.regulatoryInfo?.issuedDate && new Date(product.regulatoryInfo.issuedDate).toLocaleDateString()}</p>
            <p><span className="font-medium">Valid Until:</span> {product.regulatoryInfo?.validUntil && new Date(product.regulatoryInfo.validUntil).toLocaleDateString()}</p>
          </div>
        </Card>

        {/* Verification Status */}
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-3">Verification Status</h3>
          <div className="flex items-center space-x-2">
            {product.verificationStatus === 'Verified' ? (
              <>
                <FaCheckCircle className="text-green-500 text-xl" />
                <span className="text-green-500 font-medium">Verified</span>
              </>
            ) : product.verificationStatus === 'Suspicious' ? (
              <>
                <FaTimesCircle className="text-red-500 text-xl" />
                <span className="text-red-500 font-medium">Suspicious</span>
              </>
            ) : (
              <>
                <FaTimesCircle className="text-yellow-500 text-xl" />
                <span className="text-yellow-500 font-medium">Unverified</span>
              </>
            )}
          </div>
          {product.verifiedAt && (
            <p className="mt-2 text-sm">Last verified: {new Date(product.verifiedAt).toLocaleString()}</p>
          )}
        </Card>

        {/* Composition */}
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-3">Composition</h3>
          <div className="space-y-1">
            {product.composition?.map((item, index) => (
              <p key={index}>
                {item.ingredient}: {item.quantity}
              </p>
            ))}
          </div>
        </Card>
      </div>

      {/* Shipment Journey */}
      <Card className="p-4">
        <h3 className="text-xl font-semibold mb-4">Supply Chain Journey</h3>
        <div className="space-y-6">
          {shipmentHistory?.map((step, index) => (
            <div key={index} className="relative pl-8 pb-6 border-l-2 border-gray-200 last:border-0">
              <div className="absolute left-0 -translate-x-1/2 w-4 h-4 rounded-full bg-blue-500"></div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{step.status}</h4>
                  <span className="text-sm text-gray-500">{new Date(step.timestamp).toLocaleString()}</span>
                </div>
                <p>From: {step.from} → To: {step.to}</p>
                <p>Quantity: {step.quantity}</p>
                
                {step.environmentalConditions && (
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center">
                      <FaThermometerHalf className="mr-1" />
                      <span>{step.environmentalConditions.temperature}</span>
                    </div>
                    <div className="flex items-center">
                      <FaTint className="mr-1" />
                      <span>{step.environmentalConditions.humidity}</span>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      step.environmentalConditions.status === 'Normal' 
                        ? 'bg-green-100 text-green-800'
                        : step.environmentalConditions.status === 'Warning'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {step.environmentalConditions.status}
                    </span>
                  </div>
                )}
                
                {step.qualityCheck && (
                  <div className="mt-2 p-2 bg-gray-50 rounded-md text-sm">
                    <p className="font-medium">Quality Check</p>
                    <p>By: {step.qualityCheck.performedBy}</p>
                    <p>Result: <span className={step.qualityCheck.result === 'Pass' ? 'text-green-600' : 'text-red-600'}>
                      {step.qualityCheck.result}
                    </span></p>
                    {step.qualityCheck.notes && <p>Notes: {step.qualityCheck.notes}</p>}
                  </div>
                )}

                {step.remarks && (
                  <p className="text-sm text-gray-600">Remarks: {step.remarks}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Usage Information */}
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-3">Usage Information</h3>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Indications</h4>
            <ul className="list-disc list-inside">
              {product.usage?.indications.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">Contraindications</h4>
            <ul className="list-disc list-inside">
              {product.usage?.contraindications.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">Side Effects</h4>
            <ul className="list-disc list-inside">
              {product.usage?.sideEffects.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">Dosage</h4>
            <p>{product.usage?.dosage}</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default JourneyDetails;
