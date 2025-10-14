const mongoose = require("mongoose");
const User = require("../../models/User");
const Distributor = require("../../models/Distributor");

/**
 * @desc    Get all distributors with user details
 * @route   GET /api/admin/distributors
 * @access  Admin
 */
const getAllDistributors = async (req, res) => {
  try {
    const distributors = await User.aggregate([
      { $match: { role: "distributor" } },
      {
        $lookup: {
          from: "distributors",
          localField: "_id",
          foreignField: "user",
          as: "distributorDetails"
        }
      },
      { $unwind: { path: "$distributorDetails", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          phone: 1,
          address: 1,
          role: 1,
          country: 1,
          state: 1,
          city: 1,
          website: 1,
          isApproved: 1,
          isActive: 1,
          createdAt: 1,
          updatedAt: 1,
          distributor: {
            _id: "$distributorDetails._id",
            companyName: "$distributorDetails.companyName",
            registrationNumber: "$distributorDetails.registrationNumber",
            licenseDocument: "$distributorDetails.licenseDocument",
            warehouseAddress: "$distributorDetails.warehouseAddress",
            operationalRegions: "$distributorDetails.operationalRegions",
            createdAt: "$distributorDetails.createdAt",
            updatedAt: "$distributorDetails.updatedAt"
          }
        }
      },
      { $sort: { createdAt: -1 } }
    ]);

    res.status(200).json({
      success: true,
      count: distributors.length,
      data: distributors
    });
  } catch (err) {
    console.error("Error fetching distributors:", err);
    res.status(500).json({
      success: false,
      message: "Server error while fetching distributors",
      error: err.message
    });
  }
};

/**
 * @desc    Approve or disapprove a distributor
 * @route   PUT /api/admin/distributors/:id/approve
 * @access  Admin
 */
const approveDistributor = async (req, res) => {
  try {
    const { id } = req.params;
    const { isApproved } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid user ID" });
    }

    const user = await User.findById(id);
    if (!user || user.role !== "distributor") {
      return res.status(404).json({ success: false, message: "Distributor not found" });
    }

    user.isApproved = isApproved;
    await user.save();

    res.status(200).json({
      success: true,
      message: `Distributor ${isApproved ? "approved" : "disapproved"} successfully`,
      data: user
    });
  } catch (err) {
    console.error("Error approving distributor:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

module.exports = {
  getAllDistributors,
  approveDistributor
};
