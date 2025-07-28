import React, { useState } from "react";
import Modal from "../UI/Modal";
import Alert from "../UI/Alert";
import { FaWallet, FaEthereum, FaUserPlus } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useWalletModal } from "../../context/WalletModalContext";

const ConnectWalletModal = () => {
  const [error, setError] = useState("");
  const [showUnregisteredAlert, setShowUnregisteredAlert] = useState(false);

  const {
    connectWallet,
    login,
    isLoading,
    isAccountRegistered,
    checkAccountLoading,
  } = useAuth();
  const { isConnectModalOpen, closeConnectModal, openRegisterModal } =
    useWalletModal();

  const navigate = useNavigate();

  const redirectUser = (role) => {
    if (role === "manufacturer") navigate("/manufacturer");
    else if (role === "distributor") navigate("/distributor");
    else navigate("/");
  };

  const handleConnect = async () => {
    try {
      const { success, account, error } = await connectWallet();
      if (success) {
        if (isAccountRegistered) {
          const loginResult = await login();
          if (loginResult.success) {
            toast.success("Wallet connected and logged in successfully.");
            closeConnectModal();
            redirectUser(loginResult.role);
          } else {
            const error = loginResult.error;
            if (error && typeof error === "object" && error.code === 4001) {
              setError(
                "Action rejected: You denied the wallet signature request."
              );
            } else if (
              typeof error === "string" &&
              error.toLowerCase().includes("user rejected")
            ) {
              setError(
                "Action rejected: You denied the wallet signature request."
              );
            } else {
              setError(error?.message || error || "Login failed");
            }
          }
        } else {
          setShowUnregisteredAlert(true);
          setTimeout(() => {
            setShowUnregisteredAlert(false);
            closeConnectModal();
            openRegisterModal();
          }, 3000);
        }
      } else {
        setError(error || "Failed to connect wallet");
      }
    } catch (err) {
      setError(err.message || "Something went wrong");
    }
  };

  const handleRegisterClick = () => {
    closeConnectModal();
    openRegisterModal();
  };

  return (
    <Modal
      isOpen={isConnectModalOpen}
      onClose={closeConnectModal}
      className="max-w 2xl"
    >
      <div className="p-6">
        <div className="flex flex-col items-center justify-center mb-6">
          <div className="p-4 mb-4 rounded-full bg-primary-100">
            <FaWallet className="w-8 h-8 text-primary-600" />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-gray-900">
            Connect Your Wallet
          </h2>
          <p className="text-center text-gray-600">
            Connect your wallet to access the decentralized pharmaceutical
            supply chain.
          </p>
        </div>

        {showUnregisteredAlert && (
          <Alert
            type="error"
            className="mb-4"
            onClose={() => setShowUnregisteredAlert(false)}
          >
            Wallet connected. Please complete registration to proceed.
          </Alert>
        )}

        {!showUnregisteredAlert && error && (
          <Alert type="error" className="mb-4" onClose={() => setError("")}>
            {error}
          </Alert>
        )}

        <div className="space-y-4">
          <button
            onClick={handleConnect}
            className="flex items-center justify-between w-full p-4 transition-all duration-200 border-2 border-gray-200 rounded-lg hover:border-primary-500 group"
            disabled={isLoading || checkAccountLoading}
          >
            <div className="flex items-center">
              <FaEthereum className="w-8 h-8 mr-3 text-orange-600" />
              <div className="text-left">
                <h3 className="font-semibold text-gray-900">MetaMask</h3>
                <p className="text-sm text-gray-600">
                {isLoading ? "Connecting...": "Connect using browser wallet"}
                  
                </p>
              </div>
            </div>

            {checkAccountLoading ? (
              <span className="transition-opacity duration-200 opacity-0 text-primary-600 group-hover:opacity-100">
                Loading...
              </span>
            ) : (
              <span className="transition-opacity duration-200 opacity-0 text-primary-600 group-hover:opacity-100">
                Connect →
              </span>
            )}
          </button>
        </div>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 text-gray-500 bg-white">or</span>
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={handleRegisterClick}
              className="flex items-center justify-center w-full gap-2 px-4 py-2 transition-colors duration-200 border rounded-lg text-primary-600 border-primary-600 hover:bg-primary-50"
            >
              <FaUserPlus className="w-5 h-5" />
              Register New Account
            </button>
          </div>
        </div>

        <div className="mt-6 text-sm text-center text-gray-600">
          By connecting your wallet, you agree to our{" "}
          <a href="/terms" className="text-primary-600 hover:text-primary-700">
            Terms of Service
          </a>{" "}
          and{" "}
          <a
            href="/privacy"
            className="text-primary-600 hover:text-primary-700"
          >
            Privacy Policy
          </a>
          .
        </div>
      </div>
    </Modal>
  );
};

export default ConnectWalletModal;
