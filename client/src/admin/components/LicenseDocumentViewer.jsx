import { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XCircle, ExternalLink, Download, ZoomIn, FileText, Eye } from "lucide-react";
import toast from "react-hot-toast";

const LicenseDocumentViewer = ({ licenseDocument, compact = false }) => {
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  // Adjust dimensions based on compact mode
  const imageHeight = compact ? "h-48" : "h-64";
  const containerHeight = compact ? "h-24" : "h-32";

  if (!licenseDocument) {
    return (
      <div className="col-span-full">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="w-5 h-5 text-gray-500" />
          <span className="font-medium text-gray-700">License Document</span>
        </div>
        <div className={`flex items-center justify-center ${containerHeight} border-2 border-gray-200 border-dashed rounded-xl bg-gray-50`}>
          <div className="text-center">
            <FileText className={`${compact ? 'w-6 h-6' : 'w-8 h-8'} mx-auto text-gray-400`} />
            <p className={`mt-2 ${compact ? 'text-xs' : 'text-sm'} text-gray-500`}>No license document uploaded</p>
          </div>
        </div>
      </div>
    );
  }

  const handleDownload = async () => {
    try {
      const response = await fetch(licenseDocument);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'license-document.jpg';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Document downloaded successfully');
    } catch (error) {
      toast.error('Failed to download document');
    }
  };

  return (
    <>
      <div className="col-span-full">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            <span className="font-medium text-gray-700">License Document</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsImageViewerOpen(true)}
              className="flex items-center gap-1 px-3 py-1 text-sm text-indigo-600 transition rounded-lg bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              title="View Full Size"
            >
              <Eye className="w-4 h-4" />
              View
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1 px-3 py-1 text-sm text-green-600 transition rounded-lg bg-green-50 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-500"
              title="Download Document"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
            <a
              href={licenseDocument}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-3 py-1 text-sm text-blue-600 transition rounded-lg bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Open in New Tab"
            >
              <ExternalLink className="w-4 h-4" />
              Open
            </a>
          </div>
        </div>

        <div className="relative overflow-hidden transition-all duration-300 border border-gray-200 shadow-sm group rounded-xl hover:shadow-lg hover:border-indigo-300">
          {!imageLoaded && !imageError && (
            <div className={`flex items-center justify-center ${imageHeight} bg-gray-100 animate-pulse`}>
              <div className="text-center">
                <div className={`${compact ? 'w-6 h-6' : 'w-8 h-8'} mx-auto mb-2 bg-gray-300 rounded animate-pulse`}></div>
                <p className={`${compact ? 'text-xs' : 'text-sm'} text-gray-500`}>Loading document...</p>
              </div>
            </div>
          )}
          
          {imageError ? (
            <div className={`flex items-center justify-center ${imageHeight} bg-red-50 border border-red-200 rounded-xl`}>
              <div className="text-center">
                <XCircle className={`${compact ? 'w-6 h-6' : 'w-8 h-8'} mx-auto text-red-400`} />
                <p className={`mt-2 ${compact ? 'text-xs' : 'text-sm'} text-red-600`}>Failed to load document</p>
                <button
                  onClick={() => window.open(licenseDocument, '_blank')}
                  className="mt-2 text-xs text-blue-600 underline hover:text-blue-800"
                >
                  Try opening in new tab
                </button>
              </div>
            </div>
          ) : (
            <img
              src={licenseDocument}
              alt="License Document"
              className={`w-full ${imageHeight} object-contain bg-white transition-opacity duration-300 cursor-pointer ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              onClick={() => setIsImageViewerOpen(true)}
            />
          )}

          {/* Hover overlay */}
          {imageLoaded && !imageError && (
            <div className="absolute inset-0 flex items-center justify-center transition-opacity duration-300 opacity-0 bg-black/20 group-hover:opacity-100">
              <button
                onClick={() => setIsImageViewerOpen(true)}
                className="flex items-center gap-2 px-4 py-2 text-white transition rounded-lg bg-black/50 hover:bg-black/70 focus:outline-none focus:ring-2 focus:ring-white"
              >
                <ZoomIn className="w-4 h-4" />
                View Full Size
              </button>
            </div>
          )}
        </div>

        {!compact && (
          <div className="mt-2 text-xs text-gray-500">
            Click on the image or use the buttons above to view, download, or open in a new tab
          </div>
        )}
      </div>

      {/* Full Screen Image Viewer Modal */}
      <Transition appear show={isImageViewerOpen} as={Fragment}>
        <Dialog 
          as="div" 
          className="fixed inset-0" 
          style={{ zIndex: 20000 }} 
          onClose={() => setIsImageViewerOpen(false)}
        >
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
              className="fixed inset-0 bg-black/90 backdrop-blur-sm" 
              onClick={() => setIsImageViewerOpen(false)}
            />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex items-center justify-center min-h-full p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="relative w-full max-w-4xl">
                  {/* Close Button */}
                  <button
                    onClick={() => setIsImageViewerOpen(false)}
                    className="absolute z-10 p-2 text-white transition-all duration-200 rounded-full bg-black/50 top-2 right-2 hover:bg-black/70 focus:outline-none focus:ring-2 focus:ring-white"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>

                  {/* Image Container */}
                  <div className="overflow-hidden bg-white rounded-lg shadow-2xl">
                    <img
                      src={licenseDocument}
                      alt="License Document - Full Size"
                      className="w-full h-auto max-h-[85vh] object-contain"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-center gap-3 mt-4">
                    <button
                      onClick={handleDownload}
                      className="flex items-center gap-2 px-4 py-2 text-white transition bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                    <a
                      href={licenseDocument}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 text-white transition bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Open Original
                    </a>
                    <button
                      onClick={() => setIsImageViewerOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-gray-700 transition bg-gray-200 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    >
                      Close
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
};

export default LicenseDocumentViewer;