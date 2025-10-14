const mongoose = require("mongoose");
const User = require("../../models/User");
const Pharmacist = require("../../models/Pharmacist");

// @desc Get all pharmacists with joined user details
// @route GET /api/admin/pharmacists
// @access Admin
const getAllPharmacists = async (req, res) => {
  try {
    const pharmacists = await User.aggregate([
      { $match: { role: "pharmacist" } },
      {
        $lookup: {
          from: "pharmacists",
          localField: "_id",
          foreignField: "user",
          as: "pharmacistDetails"
        }
      },
      { $unwind: { path: "$pharmacistDetails", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          phone: 1,
          country: 1,
          state: 1,
          city: 1,
          website: 1,
          role: 1,
          isApproved: 1,
          isActive: 1,
          createdAt: 1,
          pharmacist: {
            pharmacyName: "$pharmacistDetails.pharmacyName",
            licenseNumber: "$pharmacistDetails.licenseNumber",
            licenseDocument: "$pharmacistDetails.licenseDocument",
            pharmacyLocation: "$pharmacistDetails.pharmacyLocation",
            createdAt: "$pharmacistDetails.createdAt",
            updatedAt: "$pharmacistDetails.updatedAt"
          }
        }
      },
      { $sort: { createdAt: -1 } }
    ]);

    res.status(200).json({
      success: true,
      count: pharmacists.length,
      data: pharmacists
    });
  } catch (error) {
    console.error("Error fetching pharmacists:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching pharmacists",
      error: error.message
    });
  }
};

// @desc Approve / disapprove pharmacist
// @route PUT /api/admin/pharmacists/:id/approve
// @access Admin
const approvePharmacist = async (req, res) => {
  try {
    const { id } = req.params;
    const { isApproved } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID"
      });
    }

    const user = await User.findById(id);
    if (!user || user.role !== "pharmacist") {
      return res.status(404).json({
        success: false,
        message: "Pharmacist not found"
      });
    }

    user.isApproved = isApproved;
    await user.save();

    res.status(200).json({
      success: true,
      message: `Pharmacist ${isApproved ? "approved" : "disapproved"} successfully`,
      data: user
    });
  } catch (error) {
    console.error("Error approving pharmacist:", error);
    res.status(500).json({
      success: false,
      message: "Server error while approving pharmacist",
      error: error.message
    });
  }
};

module.exports = {
  getAllPharmacists,
  approvePharmacist
};
