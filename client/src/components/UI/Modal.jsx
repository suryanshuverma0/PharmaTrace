import React, { useEffect } from "react";
import { X } from "lucide-react";

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  className = "",
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizes = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-3xl",
    '2xl':"max-w-5xl"
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center px-4 overflow-y-auto bg-black bg-opacity-60 modal-backdrop">
      <div
        className="fixed inset-0 transition-opacity "
        onClick={onClose}
      ></div>

      <div
        className={`z-50 w-full ${sizes[size]} p-6 max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-xl ${className}`}
      >
        <div className="flex items-center justify-between mb-4">
          {title && (
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          )}
          <button
            onClick={onClose}
            className="p-1 text-gray-400 transition-colors hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

export { Modal };
export default Modal;
