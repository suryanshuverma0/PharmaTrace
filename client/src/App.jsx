import React from "react";
import AppRoutes from "./routes/AppRoutes";
import { BrowserRouter as Router } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { VerifyProductButton } from "./components/common/VerifyProductButton";
import ConnectWalletModal from "./components/modals/ConnectWalletModal";
import RegisterWalletModal from "./components/modals/RegisterWalletModal";
import { useWalletModal } from "./context/WalletModalContext";

const Modals = () => {
  const {
    isConnectModalOpen,
    closeConnectModal,
    isRegisterModalOpen,
    closeRegisterModal,
    openRegisterModal,
    openConnectModal,
  } = useWalletModal();

  return (
    <>
      <ConnectWalletModal
        isOpen={isConnectModalOpen}
        onClose={closeConnectModal}
        onRegisterClick={() => {
          closeConnectModal();
          openRegisterModal();
        }}
      />
      <RegisterWalletModal
        isOpen={isRegisterModalOpen}
        onClose={closeRegisterModal}
        onConnectClick={() => {
          closeRegisterModal();
          openConnectModal();
        }}
      />
    </>
  );
};

const App = () => {
  return (
    <>
      <AppRoutes />
      {/* <VerifyProductButton /> */}
      <Modals />
      <Toaster position="top-center" reverseOrder={false} toastOptions={{ duration: 5000 }} />

    </>
  );
};

export default App;