import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Shield, BarChart3, X } from 'lucide-react';

const LocationPermissionModal = ({ 
  isOpen, 
  onAccept, 
  onDecline, 
  title = "Enable Location Tracking",
  description = "Help improve pharmaceutical supply chain monitoring" 
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-2">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="w-full max-w-lg md:max-w-sm bg-white shadow-2xl rounded-xl overflow-hidden max-h-[85vh] flex flex-col m-4 sm:m-6 lg:m-8"
        >
          {/* Header - Fixed */}
          <div className="flex-shrink-0 p-4 text-white bg-gradient-to-r from-blue-600 to-blue-700">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold truncate">{title}</h3>
                <p className="text-xs text-blue-100 truncate">{description}</p>
              </div>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-3">
              <div className="flex items-start gap-2">
                <div className="flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full flex-shrink-0 mt-0.5">
                  <Shield className="w-3 h-3 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900">Enhanced Security</h4>
                  <p className="text-xs text-gray-600">
                    Helps detect counterfeit products and suspicious patterns
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <div className="flex items-center justify-center w-6 h-6 bg-green-100 rounded-full flex-shrink-0 mt-0.5">
                  <BarChart3 className="w-3 h-3 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900">Supply Chain Analytics</h4>
                  <p className="text-xs text-gray-600">
                    Manufacturers can track global product verification
                  </p>
                </div>
              </div>
            </div>

            <div className="px-4 pb-3">
              <div className="p-3 rounded-lg bg-gray-50">
                <p className="text-xs leading-relaxed text-gray-600">
                  <strong>Privacy:</strong> Location is used for analytics only. No personal data stored.
                </p>
              </div>
            </div>
          </div>

          {/* Fixed Action Buttons */}
          <div className="flex-shrink-0 p-4 border-t border-gray-100">
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onAccept(true)}
                className="flex-1 bg-blue-600 text-white py-2.5 px-3 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Allow
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onDecline(false)}
                className="flex-1 bg-gray-200 text-gray-800 py-2.5 px-3 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
              >
                Skip
              </motion.button>
            </div>
            <p className="mt-2 text-xs text-center text-gray-500">
              Can be changed in browser settings
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default LocationPermissionModal;