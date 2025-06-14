// contexts/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from "react";
import MetaMaskService from "../services/blockchain/metamaskService";
import { getUserRole, registerUser, loginUser } from "../services/api/authApi";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);

  // Check if user is already connected on app load
  useEffect(() => {
    checkConnection();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token && isConnected) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
  }, [isConnected]);

  const checkConnection = async () => {
    try {
      const account = await MetaMaskService.getCurrentAccount();
      if (account) {
        const userRole = await getUserRole(account);
        if (userRole) {
          setUser({
            address: account,
            role: userRole.role,
            name: userRole.name,
            isRegistered: true,
          });
          setIsConnected(true);
        } else {
          setUser({
            address: account,
            role: null,
            isRegistered: false,
          });
          setIsConnected(true);
        }
      }
    } catch (error) {
      console.error("Error checking connection:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const connectWallet = async () => {
    try {
      setIsLoading(true);
      const result = await MetaMaskService.connect();

      if (result.success) {
        const userRole = await getUserRole(result.account);

        if (userRole) {
          setUser({
            address: result.account,
            role: userRole.role,
            name: userRole.name,
            isRegistered: true,
          });
        } else {
          setUser({
            address: result.account,
            role: null,
            isRegistered: false,
          });
        }

        setIsConnected(true);
        return { success: true, account: result.account };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error("Error connecting wallet:", error);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectWallet = () => {
    MetaMaskService.disconnect();
    setUser(null);
    setIsConnected(false);
    setIsAuthenticated(false);
    localStorage.removeItem("token");
  }

  const registerUserWithRole = async (userData) => {
    try {
      setIsLoading(true);

      // Generate a message to sign for verification
      const message = `Register as ${userData.role} - ${
        userData.name
      } - ${Date.now()}`;
      const signature = await MetaMaskService.signMessage(message);

      const registrationData = {
        ...userData,
        address: user.address,
        signature,
        message,
      };

      const result = await registerUser(registrationData);

      if (result.success) {
        setUser({
          ...user,
          role: userData.role,
          name: userData.name,
          isRegistered: true,
        });
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error("Error registering user:", error);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };



  const login = async () => {
    try {
      setIsLoading(true);

      if (!user.isRegistered) {
        return { success: false, error: "User not registered" };
      }

      // Generate a message to sign for login verification
      const message = `Login - ${user.address} - ${Date.now()}`;
      const signature = await MetaMaskService.signMessage(message);

      const loginData = {
        address: user.address,
        signature,
        message,
      };

      const result = await loginUser(loginData);

      if (result.success) {
        localStorage.setItem("token", result.data.token);
        setIsAuthenticated(true);
        return { success: true, role: user.role };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error("Error logging in:", error);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
    MetaMaskService.disconnect();
    setUser(null);
    setIsConnected(false);
  };

  // Listen for account changes
  useEffect(() => {
    const handleAccountChange = (accounts) => {
      if (accounts.length === 0) {
        logout();
      } else {
        checkConnection();
      }
    };

    MetaMaskService.onAccountChange(handleAccountChange);

    return () => {
      // Cleanup listeners if needed
    };
  }, []);

  const value = {
    user,
    isLoading,
    isConnected,
    connectWallet,
    registerUserWithRole,
    login,
    logout,
    disconnectWallet,
    checkConnection,
    isAuthenticated,
    
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
