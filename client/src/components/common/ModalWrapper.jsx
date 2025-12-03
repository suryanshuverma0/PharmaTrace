import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Z_INDEX, useModalBodyScroll } from '../../hooks/useModalZIndex';

/**
 * ModalWrapper - A reusable modal component with proper z-index handling
 * 
 * @param {boolean} isOpen - Whether the modal is open
 * @param {function} onClose - Function to call when modal should be closed
 * @param {React.ReactNode} children - Modal content
 * @param {string} size - Modal size: 'sm', 'md', 'lg', 'xl', 'full'
 * @param {boolean} showCloseButton - Whether to show the close button
 * @param {boolean} closeOnBackdropClick - Whether clicking backdrop closes modal
 * @param {string} className - Additional classes for modal content
 */
const ModalWrapper = ({
  isOpen,
  onClose,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnBackdropClick = true,
  className = '',
  title = null
}) => {
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    full: 'max-w-full mx-4'
  };

  const handleBackdropClick = (e) => {
    if (closeOnBackdropClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleEscapeKey = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  // Handle body scroll and escape key
  useModalBodyScroll(isOpen);
  
  React.useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={`fixed inset-0 flex items-center justify-center bg-black/50 modal-backdrop`}
            style={{ zIndex: Z_INDEX.MODAL_BACKDROP }}
            onClick={handleBackdropClick}
          >
            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={`
                relative w-full ${sizeClasses[size]} p-6 bg-white rounded-2xl shadow-2xl modal-content
                max-h-[90vh] overflow-auto m-4
                ${className}
              `}
              style={{ zIndex: Z_INDEX.MODAL }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="absolute p-2 text-gray-400 transition-colors rounded-lg top-4 right-4 hover:text-gray-600 hover:bg-gray-100"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              )}

              {/* Title */}
              {title && (
                <div className="pr-8 mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {title}
                  </h2>
                </div>
              )}

              {/* Content */}
              {children}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ModalWrapper;