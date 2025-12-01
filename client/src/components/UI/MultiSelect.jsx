import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, AlertCircle, X, Check } from 'lucide-react';

const MultiSelect = ({ 
  label, 
  options = [], 
  value = [], 
  onChange, 
  placeholder = 'Select options',
  error,
  disabled = false,
  className = '',
  searchable = true,
  maxDisplayItems = 3
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  // Filter options based on search term
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Toggle option selection
  const toggleOption = (optionValue) => {
    const newValue = value.includes(optionValue)
      ? value.filter(v => v !== optionValue)
      : [...value, optionValue];
    onChange(newValue);
  };

  // Remove selected option
  const removeOption = (optionValue, e) => {
    e.stopPropagation();
    const newValue = value.filter(v => v !== optionValue);
    onChange(newValue);
  };

  // Get display text for selected items
  const getDisplayText = () => {
    if (value.length === 0) return placeholder;
    
    const selectedOptions = options.filter(option => value.includes(option.value));
    
    if (selectedOptions.length <= maxDisplayItems) {
      return selectedOptions.map(option => option.label).join(', ');
    }
    
    const displayItems = selectedOptions.slice(0, maxDisplayItems);
    const remainingCount = selectedOptions.length - maxDisplayItems;
    
    return `${displayItems.map(option => option.label).join(', ')} (+${remainingCount} more)`;
  };

  return (
    <div className={`relative w-full ${className}`} ref={dropdownRef}>
      {label && (
        <label className="block mb-2 text-sm font-medium text-gray-700">
          {label}
        </label>
      )}

      <button
        type="button"
        className={`
          w-full px-3 py-3.5 bg-white border rounded-lg shadow-sm text-sm
          ${error ? 'border-red-500' : 'border-gray-300'}
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'cursor-pointer'}
          focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          flex items-center justify-between text-left
        `}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
      >
        <div className="flex-1 min-w-0">
          {value.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {value.map((val) => {
                const option = options.find(opt => opt.value === val);
                return option ? (
                  <span
                    key={val}
                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-800 bg-blue-100 rounded-md"
                  >
                    {option.label}
                    <button
                      type="button"
                      onClick={(e) => removeOption(val, e)}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ) : null;
              })}
            </div>
          ) : (
            <span className="text-gray-500">{placeholder}</span>
          )}
        </div>
        <ChevronDown
          className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ml-2 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
          {searchable && (
            <div className="p-3 border-b border-gray-200">
              <input
                type="text"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Search districts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
              />
            </div>
          )}
          
          <div className="py-1 overflow-auto max-h-60">
            {filteredOptions.length > 0 ? (
              <>
                {value.length > 0 && (
                  <button
                    type="button"
                    className="w-full px-3 py-2 text-sm text-left text-red-600 border-b border-gray-100 hover:bg-red-50 focus:bg-red-50 focus:outline-none"
                    onClick={() => onChange([])}
                  >
                    Clear all selections
                  </button>
                )}
                {filteredOptions.map((option) => {
                  const isSelected = value.includes(option.value);
                  return (
                    <button
                      key={option.value}
                      type="button"
                      className={`
                        w-full px-3 py-2 text-left text-sm flex items-center justify-between
                        ${isSelected ? 'bg-blue-50 text-blue-900' : 'text-gray-900'}
                        hover:bg-blue-50 focus:bg-blue-50 focus:outline-none
                      `}
                      onClick={() => toggleOption(option.value)}
                    >
                      <span>{option.label}</span>
                      {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                    </button>
                  );
                })}
              </>
            ) : (
              <div className="px-3 py-2 text-sm text-gray-500">
                No districts found
              </div>
            )}
          </div>
          
          {value.length > 0 && (
            <div className="px-3 py-2 text-xs text-gray-500 border-t border-gray-200 bg-gray-50">
              {value.length} district{value.length !== 1 ? 's' : ''} selected
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="flex items-center mt-1 text-sm text-red-600">
          <AlertCircle className="w-4 h-4 mr-1" />
          {error}
        </p>
      )}
    </div>
  );
};

export { MultiSelect };
export default MultiSelect;