import apiClient from "./api";
// Get user role by wallet address
export const getUserRole = async (address) => {
  try {
    const res = await apiClient.get(`/auth/user/${address}`);
    return res.data.data;
  } catch (error) {
    if (error.response?.status === 404) return null;
    throw error;
  }
};

// Register new usera
export const registerUser = async (userData) => {
  try {
    const res = await apiClient.post('/auth/register', userData);
    return { success: true, data: res.data.data };
  } catch (error) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
};

// Login user
export const loginUser = async (loginData) => {
  try {
    const res = await apiClient.post('/auth/login', loginData);
    return { success: true, data: res.data.data };
  } catch (error) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
};

// Get manufacturer data
export const getManufacturerData = async (address) => {
  try {
    const res = await apiClient.get(`/manufacturer/${address}`);
    return res.data.data;
  } catch (error) {
    throw error;
  }
};

// Get distributor data
export const getDistributorData = async (address) => {
  try {
    const res = await apiClient.get(`/distributor/${address}`);
    return res.data.data;
  } catch (error) {
    throw error;
  }
};

// Verify MetaMask signature on backend
export const verifySignature = async (address, message, signature) => {
  try {
    const res = await apiClient.post('/auth/verify-signature', { address, message, signature });
    return res.data;
  } catch (error) {
    throw error;
  }
};

// Check if user is superadmin
export const checkSuperAdmin = async (address) => {
  try {
    const res = await apiClient.post('/auth/check-superadmin', { address });
    return { 
      success: true, 
      isSuperAdmin: res.data.isSuperAdmin,
      data: res.data 
    };
  } catch (error) {
    return { 
      success: false, 
      isSuperAdmin: false,
      error: error.response?.data?.message || error.message 
    };
  }
};
