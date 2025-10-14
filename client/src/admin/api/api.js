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