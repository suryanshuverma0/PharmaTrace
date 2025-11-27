import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XCircle, CheckCircle } from "lucide-react";

const ConfirmationModal = ({ isOpen, closeModal, onConfirm, message ,color }) => {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="fixed inset-0" style={{ zIndex: 15000 }} onClose={closeModal}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="relative w-full max-w-md p-6 bg-white border-2 border-gray-200 shadow-2xl rounded-2xl">
              <button
                onClick={closeModal}
                className="absolute text-gray-500 transition-colors top-4 right-4 hover:text-gray-900"
              >
                <XCircle className="w-6 h-6" />
              </button>

              <div className="flex flex-col items-center text-center">
                <CheckCircle className={`w-12 h-12 mb-4 ${color === "red" ? "text-red-500" : "text-green-500"}`} />
                <Dialog.Title className="mb-2 text-xl font-bold text-gray-900">Confirm Action</Dialog.Title>
                <p className="mb-6 text-gray-700">{message}</p>
                <div className="flex gap-4">
                 <button
  onClick={onConfirm}
  className={`px-4 py-2 rounded-lg text-white hover:opacity-90 ${
    color === "red" ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
  }`}
>
  Yes
</button>

                  <button
                    onClick={closeModal}
                    className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
};

export default ConfirmationModal;
