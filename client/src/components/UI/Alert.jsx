import React from 'react';
import { Check, AlertCircle, Info, X } from 'lucide-react';

const Alert = ({ 
  type = 'info', 
  title, 
  children, 
  onClose,
  className = '' 
}) => {
  const types = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: <Check className="w-5 h-5 text-green-600" />,
      title: 'text-green-800',
      text: 'text-green-700'
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: <AlertCircle className="w-5 h-5 text-red-600" />,
      title: 'text-red-800',
      text: 'text-red-700'
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      icon: <AlertCircle className="w-5 h-5 text-yellow-600" />,
      title: 'text-yellow-800',
      text: 'text-yellow-700'
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: <Info className="w-5 h-5 text-blue-600" />,
      title: 'text-blue-800',
      text: 'text-blue-700'
    }
  };
  
  const config = types[type];

  // Determine what content to show as message:
  // If children exists, show children,
  // else if title exists and children don't, show title as message,
  // else fallback text.
  const messageContent = children || (title ? <span>{title}</span> : <span>Alert</span>);

  return (
    <div className={`${config.bg} ${config.border} border rounded-lg p-4 ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">{config.icon}</div>
        <div className="flex-1 ml-3">
          {/* Show title only if children is present (to avoid duplication with messageContent above) */}
          {children && title && (
            <h3 className={`text-sm font-medium ${config.title}`}>{title}</h3>
          )}
          <div className={`text-sm ${config.text} ${title && children ? 'mt-2' : ''}`}>
            {messageContent}
          </div>
        </div>
        {onClose && (
          <div className="pl-3 ml-auto">
            <button
              onClick={onClose}
              className={`inline-flex rounded-md p-1.5 ${config.text} hover:bg-opacity-20 hover:bg-gray-600`}
              aria-label="Close alert"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export { Alert };       
export default Alert;
