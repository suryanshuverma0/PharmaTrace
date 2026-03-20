import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XCircle, Copy, ExternalLink } from "lucide-react";

const ActivityModal = ({ isOpen, closeModal, activity }) => {
  if (!activity) return null;

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="fixed inset-0 z-50" onClose={closeModal}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl my-8">
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>

              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-indigo-200 px-8 pt-8 pb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                  {activity.title}
                </h2>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold bg-indigo-100 text-indigo-800 capitalize">
                    {activity.type}
                  </span>
                  <span className="text-sm text-gray-600">
                    {new Date(activity.createdAt).toLocaleDateString()}{" "}
                    {new Date(activity.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              </div>

              <div className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Transaction Hash */}
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Transaction Hash
                    </label>
                    <div className="flex items-center gap-2 group">
                      <code className="flex-1 text-sm bg-gray-50 px-4 py-3 rounded-lg border border-gray-200 font-mono text-gray-900 hover:bg-gray-100 transition-colors">
                        {activity.txHash || "-"}
                      </code>
                      {activity.txHash && (
                        <button
                          onClick={() => copyToClipboard(activity.txHash)}
                          className="p-3 rounded-lg hover:bg-indigo-100 transition-colors opacity-0 group-hover:opacity-100"
                          title="Copy"
                        >
                          <Copy className="w-4 h-4 text-indigo-600" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Block Details */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Block Number
                    </label>
                    <div className="text-sm bg-gray-50 px-4 py-3 rounded-lg border border-gray-200 text-gray-900">
                      {activity.blockNumber || "-"}
                    </div>
                  </div>

                  {/* Gas Used */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Gas Used
                    </label>
                    <div className="text-sm bg-gray-50 px-4 py-3 rounded-lg border border-gray-200 text-gray-900">
                      {activity.gasUsed ? `${activity.gasUsed} Wei` : "-"}
                    </div>
                  </div>

                  {/* From Address */}
                  {activity.from && (
                    <div className="col-span-1 md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        From Address
                      </label>
                      <div className="flex items-center gap-2 group">
                        <code className="flex-1 text-sm bg-gray-50 px-4 py-3 rounded-lg border border-gray-200 font-mono text-gray-900 hover:bg-gray-100 transition-colors break-all">
                          {activity.from}
                        </code>
                        <button
                          onClick={() => copyToClipboard(activity.from)}
                          className="p-3 rounded-lg hover:bg-indigo-100 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                          title="Copy"
                        >
                          <Copy className="w-4 h-4 text-indigo-600" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Block Explorer Link */}
                  {activity.explorerUrl && (
                    <div className="col-span-1 md:col-span-2">
                      <a
                        href={activity.explorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-3 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-semibold transition-colors border border-indigo-200"
                      >
                        <ExternalLink className="w-4 h-4" />
                        View on Block Explorer
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
};

export default ActivityModal;
