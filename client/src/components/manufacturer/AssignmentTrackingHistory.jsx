import React from 'react';
import { motion } from 'framer-motion';
import { FiPackage, FiTruck, FiCheck, FiMapPin, FiThermometer } from 'react-icons/fi';
import TemperatureChart from './TemperatureChart';

const AssignmentTrackingHistory = ({ tracking, temperature }) => {
  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case 'assigned':
        return <FiPackage className="w-5 h-5" />;
      case 'shipped':
      case 'in_transit':
        return <FiTruck className="w-5 h-5" />;
      case 'delivered':
        return <FiCheck className="w-5 h-5" />;
      default:
        return <FiMapPin className="w-5 h-5" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'assigned':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'shipped':
      case 'in_transit':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="mt-4">
      <h3 className="text-lg font-semibold mb-4">Tracking History</h3>
      
      <div className="space-y-4">
        {tracking.recent.map((event, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className={`p-4 rounded-lg border ${getStatusColor(event.status)} relative`}
          >
            {index !== tracking.recent.length - 1 && (
              <div className="absolute left-7 -bottom-4 w-0.5 h-4 bg-gray-300" />
            )}
            
            <div className="flex items-start gap-4">
              <div className={`p-2 rounded-full ${getStatusColor(event.status)}`}>
                {getStatusIcon(event.status)}
              </div>
              
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h4 className="font-medium">{event.status}</h4>
                  <span className="text-sm text-gray-500">
                    {new Date(event.timestamp).toLocaleString()}
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                
                {event.location && (
                  <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                    <FiMapPin className="w-4 h-4" />
                    <span>{event.location}</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Tracking Summary */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-500">Total Products</div>
          <div className="text-2xl font-semibold mt-1">{tracking.summary.total}</div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-500">In Transit</div>
          <div className="text-2xl font-semibold mt-1 text-blue-600">
            {tracking.summary.inTransit}
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-500">Delivered</div>
          <div className="text-2xl font-semibold mt-1 text-green-600">
            {tracking.summary.delivered}
          </div>
        </div>
      </div>

      {temperature && temperature.length > 0 && (
        <div className="mt-6">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <FiThermometer className="mr-2" />
              Temperature Monitoring
            </h3>
            <TemperatureChart temperatureData={temperature} />
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignmentTrackingHistory;
