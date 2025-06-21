import React, { createContext, useContext, useState } from "react";
import { useNavigate } from "react-router";

const WalletModalContext = createContext();

export const WalletModalProvider = ({ children }) => {
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const navigate = useNavigate();


  const openConnectModal = () => {
    navigate('/')
    setIsConnectModalOpen(true)
  };
  const closeConnectModal = () => setIsConnectModalOpen(false);

  const openRegisterModal = () => {
    navigate('/')
    setIsRegisterModalOpen(true)};
  const closeRegisterModal = () => setIsRegisterModalOpen(false);

  return (
    <WalletModalContext.Provider
      value={{
        isConnectModalOpen,
        openConnectModal,
        closeConnectModal,
        isRegisterModalOpen,
        openRegisterModal,
        closeRegisterModal,
      }}
    >
      {children}
    </WalletModalContext.Provider>
  );
};

export const useWalletModal = () => useContext(WalletModalContext);
