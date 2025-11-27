// contexts/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from "react";
import MetaMaskService from "../services/blockchain/metamaskService";
import { getUserRole, registerUser, loginUser } from "../services/api/authApi";
import {jwtDecode} from 'jwt-decode';

export function decodeToken(token) {
  try {
    return jwtDecode(token);
  } catch (error) {
    console.error('Invalid token:', error);
    return null;
  }
}


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
  const [isLoading, setIsLoading] = useState(false);
  const [isAccountRegistered, setisAccountRegistered] = useState(false);

  const [isConnected, setIsConnected] = useState(false);
  const [checkAccountLoading, setCheckAccountLoading] = useState(true);
  const [connectedAddress, setConnectedAddress] = useState(null);

  // Check if user is already connected on app load
  useEffect(() => {
    checkConnection();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    // If we have a valid token, set authenticated immediately
    // Don't wait for wallet connection check for existing sessions
    if (token) {
      const decodedToken = decodeToken(token);
      if (decodedToken && decodedToken.exp * 1000 > Date.now()) {
        setIsAuthenticated(true);
        // Also set user data immediately from token
        setUser(decodedToken);
        return;
      } else {
        // Token is expired, remove it
        localStorage.removeItem("token");
      }
    }
    
    // Only set to false if we don't have a valid token AND connection check is complete
    if (!checkAccountLoading) {
      setIsAuthenticated(false);
    }
  }, [isConnected, checkAccountLoading]);
  

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (isAuthenticated && token) {
      const decodedUser = decodeToken(token);
      if (decodedUser && !user) {
        setUser(decodedUser);
      }
    }
  }, [isAuthenticated, user])

  const checkConnection = async () => {
    try {
      const account = await MetaMaskService.getCurrentAccount();
      if (account) {
        const user = await getUserRole(account);

        // Use case-insensitive comparison for Ethereum addresses
        if (user?.address.toLowerCase() === account.toLowerCase()) {
          setConnectedAddress(user?.address || account)
          setisAccountRegistered(true);
          setIsConnected(true);
        } else {
          setisAccountRegistered(false);
          setIsConnected(false);
        }
      }
    } catch (error) {
      console.error("Error checking connection:", error);
    } finally {
      setCheckAccountLoading(false);
    }
  };

  const connectWallet = async () => {
    try {
      setIsLoading(true);
      const result = await MetaMaskService.connect();

      

      if (result.success) {
        setConnectedAddress(result?.account)
        return { success: true, account: result.account };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectWallet = () => {
    // MetaMaskService.disconnect();
    setUser(null);
    setIsConnected(false);
    setIsAuthenticated(false);
    localStorage.removeItem("token");
  };


  const registerUserWithRole = async (userData, isFormData = false) => {
  try {
    setIsLoading(true);
    if (!connectedAddress) {
      const connectResult = await connectWallet();
      if (!connectResult.success) {
        return { success: false, error: connectResult.error };
      }
    }

    // If JSON data, add address, message, signature as before
    let payload = userData;
    if (!isFormData) {
      const message = `Register as ${userData.role} - ${userData.name} - ${Date.now()}`;
      const signature = await MetaMaskService.signMessage(message);
      payload = { address: connectedAddress, signature, message, ...userData };
    }

    // Send payload to backend
    const result = await registerUser(payload, isFormData); // registerUser should accept FormData
    if (result.success) {
      setUser({
        ...user,
        role: userData.role,
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        country: userData.country,
        isRegistered: true,
      });
      return { success: true };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    return { success: false, error: error.message };
  } finally {
    setIsLoading(false);
  }
};


  const login = async () => {
    try {
      setIsLoading(true);

      if (!isAccountRegistered) {
        return { success: false, error: "User not registered" };
      }

      // Generate a message to sign for login verification
      const message = `Login - ${connectedAddress} - ${Date.now()}`;
      const signature = await MetaMaskService.signMessage(message);

      const loginData = {
        address: connectedAddress,
        signature,
        message,
      };

      const result = await loginUser(loginData);

      if (result.success) {
        localStorage.setItem("token", result?.data?.token);
        setIsAuthenticated(true);
        return { success: true, role: result?.data?.role };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
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
    checkAccountLoading,
    isConnected,
    connectWallet,
    registerUserWithRole,
    login,
    logout,
    disconnectWallet,
    isAuthenticated,
    isAccountRegistered

  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
