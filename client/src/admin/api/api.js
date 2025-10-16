import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:3000/api",
  headers: { "Content-Type": "application/json" },
});

// Fetch all manufacturers
export const getAllManufacturers = async () => {
  try {
    const res = await API.get("/admin/manufacturers");
    return res.data.data;
  } catch (err) {
    console.error("Error fetching manufacturers:", err);
    return [];
  }
};

// Approve / disapprove manufacturer
export const approveManufacturer = async (id, isApproved) => {
  try {
    const res = await API.put(`/admin/manufacturers/${id}/approve`, { isApproved });
    return res.data;
  } catch (err) {
    console.error("Error approving manufacturer:", err);
    return null;
  }
};

// Fetch all distributors
export const getAllDistributors = async () => {
  try {
    const res = await API.get("/admin/distributors");
    return res.data.data;
  } catch (err) {
    console.error("Error fetching distributors:", err);
    return [];
  }
};

// Approve / disapprove distributor
export const approveDistributor = async (id, isApproved) => {
  try {
    const res = await API.put(`/admin/distributors/${id}/approve`, { isApproved });
    return res.data;
  } catch (err) {
    console.error("Error approving distributor:", err);
    return null;
  }
};

export const getAllPharmacists = async () => {
  try {
    const res = await API.get("/admin/pharmacists");
    return res.data.data || [];
  } catch (err) {
    console.error("Error fetching pharmacists:", err);
    return [];
  }
};

/**
 * Approve / disapprove a pharmacist
 * PUT /api/admin/pharmacists/:id/approve
 * body: { isApproved: true|false }
 */
export const approvePharmacist = async (id, isApproved) => {
  try {
    const res = await API.put(`/admin/pharmacists/${id}/approve`, { isApproved });
    return res.data;
  } catch (err) {
    console.error("Error approving pharmacist:", err);
    return null;
  }
};

// ===== ADMIN ANALYTICS & TRACKING APIs =====

// Get admin dashboard analytics
export const getAdminAnalytics = async (timeRange = '7d') => {
  try {
    const res = await API.get(`/admin/analytics?timeRange=${timeRange}`);
    return res.data;
  } catch (err) {
    console.error("Error fetching admin analytics:", err);
    return {
      data: {
        overview: {
          totalScans: 0,
          uniqueProductCount: 0,
          authenticationRate: 0,
          totalProducts: 0,
          totalBatches: 0,
          verifiedProducts: 0,
          activeShipments: 0,
          systemHealth: 100,
          blockchainTxns: 0
        },
        timeSeriesData: [],
        deviceAnalytics: [],
        productAnalytics: []
      }
    };
  }
};

// Get admin real-time verifications
export const getAdminRealtimeVerifications = async (limit = 20) => {
  try {
    const res = await API.get(`/admin/realtime-verifications?limit=${limit}`);
    return res.data;
  } catch (err) {
    console.error("Error fetching admin realtime verifications:", err);
    return { data: [] };
  }
};

// Get admin location analytics
export const getAdminLocationAnalytics = async () => {
  try {
    const res = await API.get("/admin/location-analytics");
    return res.data;
  } catch (err) {
    console.error("Error fetching admin location analytics:", err);
    return { data: [] };
  }
};

// Get admin dashboard stats
export const getAdminDashboardStats = async () => {
  try {
    const res = await API.get("/admin/dashboard-stats");
    return res.data;
  } catch (err) {
    console.error("Error fetching admin dashboard stats:", err);
    return {
      totalProducts: 0,
      totalBatches: 0,
      verifiedProducts: 0,
      activeShipments: 0,
      systemHealth: 100,
      blockchainTxns: 0,
      totalVerifications: 0,
      authenticationRate: 0
    };
  }
};

// Get recent activities for admin
export const getAdminRecentActivities = async (limit = 10) => {
  try {
    const res = await API.get(`/admin/recent-activities?limit=${limit}`);
    return res.data.data || [];
  } catch (err) {
    console.error("Error fetching admin recent activities:", err);
    return [];
  }
};

// Get system alerts for admin
export const getAdminSystemAlerts = async () => {
  try {
    const res = await API.get("/admin/system-alerts");
    return res.data.data || [];
  } catch (err) {
    console.error("Error fetching admin system alerts:", err);
    return [];
  }
};

// ===== ADMIN BLOCKCHAIN MANAGEMENT =====

// Transfer contract ownership (admin role)
export const transferOwnership = async (newAdmin) => {
  try {
    const res = await API.post("/admin/transfer-admin", { newAdmin });
    return res.data;
  } catch (err) {
    console.error("Error transferring ownership:", err);
    return { success: false, error: err.message };
  }
};
