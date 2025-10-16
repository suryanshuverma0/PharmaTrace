const mongoose = require("mongoose");
const User = require("../../models/User");
const Distributor = require("../../models/Distributor");
const { signer, userRegistry } = require("../../utils/blockchain"); 

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
// Approve or disapprove a distributor (MongoDB + Blockchain)
const approveDistributor = async (req, res) => {
  try {
    const { id } = req.params;
    const { isApproved } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false, message: "Invalid user ID" });

    const user = await User.findById(id);
    if (!user || user.role !== "distributor")
      return res.status(404).json({ success: false, message: "Distributor not found" });

    // Update MongoDB
    user.isApproved = isApproved;
    await user.save();

    // Update blockchain
    const RoleEnum = { None: 0, Manufacturer: 1, Distributor: 2, Pharmacist: 3 };
    try {
      const tx = await userRegistry.setUser(user.address, isApproved, RoleEnum.Distributor);
      await tx.wait();
      console.log(`✅ UserRegistry: ${user.address} setApproval = ${isApproved}, role = Distributor`);
    } catch (err) {
      console.error("⚠️ Blockchain update failed:", err.message);
      return res.status(500).json({
        success: false,
        message: "MongoDB updated but blockchain transaction failed",
        error: err.message,
      });
    }

    res.status(200).json({
      success: true,
      message: `Distributor ${isApproved ? "approved" : "disapproved"} successfully (MongoDB + Blockchain)`,
      data: user,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

module.exports = {
  getAllDistributors,
  approveDistributor
};
