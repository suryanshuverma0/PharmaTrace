import React from 'react';
import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Shield, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import { Z_INDEX } from '../../hooks/useModalZIndex';

/**
 * Enhanced AdminModalWrapper with attractive design and proper z-index
 * 
 * @param {boolean} isOpen - Whether the modal is open
 * @param {function} onClose - Function to call when modal should be closed
 * @param {React.ReactNode} children - Modal content
 * @param {string} title - Modal title
 * @param {string} subtitle - Optional subtitle
 * @param {string} size - Modal size: 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl'
 * @param {string} type - Modal type: 'default', 'success', 'warning', 'error', 'info'
 * @param {boolean} showCloseButton - Whether to show the close button
 * @param {boolean} blur - Whether to blur the background
 * @param {React.ReactNode} icon - Optional icon for the header
 */
const AdminModalWrapper = ({
  isOpen,
  onClose,
  children,
  title,
  subtitle,
  size = 'xl',
  type = 'default',
  showCloseButton = true,
  blur = true,
  icon = null
}) => {
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md', 
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    full: 'max-w-full mx-4'
  };

  const typeConfig = {
    default: {
      bgGradient: 'from-blue-50 to-indigo-50',
      borderColor: 'border-blue-200',
      iconColor: 'text-blue-600',
      titleColor: 'text-gray-900',
      icon: <Shield className="w-6 h-6" />
    },
    success: {
      bgGradient: 'from-green-50 to-emerald-50',
      borderColor: 'border-green-200',
      iconColor: 'text-green-600',
      titleColor: 'text-green-900',
      icon: <CheckCircle className="w-6 h-6" />
    },
    warning: {
      bgGradient: 'from-yellow-50 to-orange-50',
      borderColor: 'border-yellow-200',
      iconColor: 'text-yellow-600',
      titleColor: 'text-yellow-900',
      icon: <AlertTriangle className="w-6 h-6" />
    },
    error: {
      bgGradient: 'from-red-50 to-rose-50',
      borderColor: 'border-red-200',
      iconColor: 'text-red-600',
      titleColor: 'text-red-900',
      icon: <AlertTriangle className="w-6 h-6" />
    },
    info: {
      bgGradient: 'from-cyan-50 to-blue-50',
      borderColor: 'border-cyan-200',
      iconColor: 'text-cyan-600',
      titleColor: 'text-cyan-900',
      icon: <Info className="w-6 h-6" />
    }
  };

  const config = typeConfig[type];
  const modalIcon = icon || config.icon;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog 
        as="div" 
        className="relative"
        style={{ zIndex: Z_INDEX.MODAL_BACKDROP }}
        onClose={onClose}
      >
        {/* Background Overlay */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div 
            className={`fixed inset-0 bg-gradient-to-br from-black/60 to-gray-900/80 ${
              blur ? 'backdrop-blur-sm' : ''
            }`}
            style={{ zIndex: Z_INDEX.MODAL_BACKDROP }}
          />
        </Transition.Child>

        {/* Modal Container */}
        <div 
          className="fixed inset-0 overflow-y-auto"
          style={{ zIndex: Z_INDEX.MODAL }}
        >
          <div className="flex items-center justify-center min-h-full p-4 sm:p-6">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95 translate-y-4"
              enterTo="opacity-100 scale-100 translate-y-0"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100 translate-y-0"
              leaveTo="opacity-0 scale-95 translate-y-4"
            >
              <Dialog.Panel 
                className={`
                  relative w-full ${sizeClasses[size]} 
                  bg-white rounded-2xl shadow-2xl 
                  transform transition-all duration-300
                  border-2 ${config.borderColor}
                  overflow-hidden
                `}
                style={{ zIndex: Z_INDEX.MODAL + 1 }}
              >
                {/* Decorative Header Background */}
                <div className={`absolute top-0 left-0 right-0 h-32 bg-gradient-to-br ${config.bgGradient} opacity-50`} />
                
                {/* Close Button */}
                {showCloseButton && (
                  <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 p-2 text-gray-400 transition-all duration-200 bg-white rounded-full shadow-lg hover:text-gray-600 hover:bg-gray-50 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    aria-label="Close modal"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}

                {/* Header */}
                {(title || subtitle) && (
                  <div className="relative px-6 pt-8 pb-4 sm:px-8">
                    <div className="flex items-start gap-4">
                      {modalIcon && (
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ duration: 0.4, type: "spring" }}
                          className={`
                            flex-shrink-0 p-3 rounded-xl bg-white shadow-lg
                            ${config.iconColor}
                            border-2 ${config.borderColor}
                          `}
                        >
                          {modalIcon}
                        </motion.div>
                      )}
                      <div className="flex-1 min-w-0">
                        {title && (
                          <Dialog.Title
                            as="h3"
                            className={`text-2xl font-bold leading-tight ${config.titleColor} mb-1`}
                          >
                            {title}
                          </Dialog.Title>
                        )}
                        {subtitle && (
                          <p className="text-gray-600 text-sm leading-relaxed">
                            {subtitle}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Content */}
                <div className="relative px-6 pb-6 sm:px-8 sm:pb-8">
                  <div className="bg-white rounded-xl">
                    {children}
                  </div>
                </div>

                {/* Decorative Footer */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default AdminModalWrapper;