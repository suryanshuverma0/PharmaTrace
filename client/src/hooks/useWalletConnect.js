import { useState, useEffect } from "react";
import { ethers } from "ethers";

const useWalletConnect = () => {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const connectWallet = async () => {
    if (typeof window.ethereum === "undefined") {
      setError("Please install MetaMask to connect your wallet.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts found.");
      }

      const ethProvider = new ethers.BrowserProvider(window.ethereum);
      setProvider(ethProvider);
      setAccount(accounts[0]);
      setError(null);

      // Return the account for immediate use
      return accounts[0];
    } catch (err) {
      console.error("Connection error:", err);
      if (err.code === 4001) {
        setError("You rejected the connection request.");
      } else if (err.code === -32002) {
        setError("Please check MetaMask. A connection request is pending.");
      } else {
        setError("Failed to connect wallet. Please try again.");
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setProvider(null);
  };

  useEffect(() => {
    // Check if already connected
    if (window.ethereum) {
      window.ethereum
        .request({ method: "eth_accounts" })
        .then((accounts) => {
          if (accounts.length > 0) {
            setAccount(accounts[0]);
            const ethProvider = new ethers.BrowserProvider(window.ethereum);
            setProvider(ethProvider);
          }
        })
        .catch(console.error);

      // Listen for account changes
      window.ethereum.on("accountsChanged", (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
        } else {
          setAccount(null);
          setProvider(null);
        }
      });

      // Listen for chain changes
      window.ethereum.on("chainChanged", () => {
        window.location.reload();
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener("accountsChanged", () => {});
        window.ethereum.removeListener("chainChanged", () => {});
      }
    };
  }, []);

  return {
    account,
    connectWallet,
    disconnectWallet,
    provider,
    error,
    isLoading,
    isConnected: !!account,
  };
};

export default useWalletConnect;
