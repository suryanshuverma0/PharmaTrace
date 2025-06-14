import React from 'react';
import { Upload } from 'lucide-react';

 const FileUpload = ({ 
  onFileSelect, 
  accept, 
  multiple = false, 
  className = '',
  children 
}) => {
  const handleFileChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileSelect(multiple ? Array.from(files) : files[0]);
    }
  };
  
  return (
    <div className={`relative ${className}`}>
      <input
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
      <div className="flex flex-col items-center justify-center p-6 transition-colors border-2 border-gray-300 border-dashed rounded-lg hover:border-blue-400">
        <Upload className="w-8 h-8 mb-2 text-gray-400" />
        {children || (
          <div className="text-center">
            <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
            <p className="mt-1 text-xs text-gray-500">PNG, JPG, PDF up to 10MB</p>
          </div>
        )}
      </div>
    </div>
  );
};

export {FileUpload}
export default FileUpload;