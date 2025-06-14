import React from 'react';

 const Card = ({ 
  children, 
  title, 
  subtitle,
  className = '',
  hover = false,
  padding = 'p-6',
  ...props 
}) => {
  return (
    <div
      className={`bg-white rounded-xl border border-gray-200 shadow-sm ${
        hover ? 'hover:shadow-lg hover:-translate-y-1 transition-all duration-300' : ''
      } ${padding} ${className}`}
      {...props}
    >
      {(title || subtitle) && (
        <div className="mb-4">
          {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
          {subtitle && <p className="mt-1 text-sm text-gray-600">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  );
};

export { Card };
export default Card;