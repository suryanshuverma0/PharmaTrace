// services/api/blockchainApi.js
import apiClient from "./api";

// Get all blockchain activity with pagination and optional search
export const getAllBlockchainActivity = async (
  params = { limit: 50, search: "" }
) => {
  try {
    const res = await apiClient.get("/admin/blockchain-activity", { params });
    console.log("Blockchain API Response:", res.data);

    // Handle both direct data and nested data structure
    const data = res.data?.data || res.data;
    return { success: true, data };
  } catch (error) {
    console.error("Blockchain API Error:", error);
    return {
      success: false,
      error: error.response?.data?.message || error.message,
    };
  }
};

// Get single record details
export const getBlockchainTxDetails = async (type, id) => {
  try {
    const res = await apiClient.get(`/admin/blockchain-activity/${type}/${id}`);
    return { success: true, data: res.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message,
    };
  }
};

// Reverify a single tx
export const reverifyBlockchainTx = async (type, id) => {
  try {
    const res = await apiClient.post(
      `/admin/blockchain-activity/${type}/${id}/reverify`
    );
    return { success: true, data: res.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message,
    };
  }
};

// Bulk reverify multiple records
export const bulkReverifyBlockchainTx = async (records) => {
  try {
    const results = [];
    for (const rec of records) {
      const res = await reverifyBlockchainTx(rec.type, rec.id);
      results.push(res);
    }
    return { success: true, data: results };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
