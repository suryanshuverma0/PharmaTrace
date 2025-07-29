import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiTruck, FiPackage, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import AssignmentTrackingHistory from './AssignmentTrackingHistory';

const RecentAssignments = ({ assignments }) => {
  const [expandedAssignment, setExpandedAssignment] = useState(null);

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'assigned':
        return 'bg-yellow-100 text-yellow-800';
      case 'shipped':
      case 'in_transit':
        return 'bg-blue-100 text-blue-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!assignments.length) {
    return (
      <div className="text-center py-8">
        <FiPackage className="mx-auto text-4xl text-gray-400 mb-2" />
        <p className="text-gray-500">No recent assignments</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {assignments.map((assignment) => (
        <motion.div
          key={assignment._id}
          className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div
            className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => setExpandedAssignment(
              expandedAssignment === assignment._id ? null : assignment._id
            )}
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-lg font-semibold">
                  Batch #{assignment.batchNumber}
                </h3>
                <p className="text-sm text-gray-600">
                  {assignment.distributor.name}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm flex items-center ${getStatusColor(assignment.status)}`}>
                {assignment.status === 'shipped' || assignment.status === 'in_transit' ? (
                  <FiTruck className="mr-1" />
                ) : (
                  <FiPackage className="mr-1" />
                )}
                {assignment.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-2">
              <div>
                <span className="font-medium">Quantity:</span> {assignment.quantity}
              </div>
              <div>
                <span className="font-medium">Assigned:</span>{' '}
                {new Date(assignment.assignedAt).toLocaleDateString()}
              </div>
            </div>

            {assignment.remarks && (
              <p className="text-sm text-gray-500 mt-2">{assignment.remarks}</p>
            )}

            <button
              className="flex items-center text-blue-600 hover:text-blue-700 transition-colors mt-2"
            >
              {expandedAssignment === assignment._id ? (
                <>
                  <FiChevronUp className="mr-1" />
                  Hide Details
                </>
              ) : (
                <>
                  <FiChevronDown className="mr-1" />
                  View Details
                </>
              )}
            </button>
          </div>

          <AnimatePresence>
            {expandedAssignment === assignment._id && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="border-t border-gray-200"
              >
                <div className="p-4 bg-gray-50">
                  <AssignmentTrackingHistory 
                    tracking={assignment.tracking} 
                    temperature={assignment.temperature}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}
    </div>
  );
};

export default RecentAssignments;
