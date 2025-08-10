import React from 'react';
import { Info, Package, Truck, Users } from 'lucide-react';

const QuantityExplanation = () => {
  return (
    <div className="p-4 mb-6 bg-blue-50 border border-blue-200 rounded-xl">
      <div className="flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div>
          <h4 className="font-medium text-blue-900 mb-2">Understanding Batch Quantities</h4>
          <div className="space-y-2 text-sm text-blue-800">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              <span><strong>Produced:</strong> Total quantity manufactured for this batch</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span><strong>Products Registered:</strong> Individual products registered in the system</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4" />
              <span><strong>Assigned:</strong> Quantity assigned to distributors in bulk</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded-full"></div>
              <span><strong>Remaining:</strong> Available for bulk assignment to distributors</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuantityExplanation;
