const mongoose = require("mongoose");
const User = require("../../models/User");
const Pharmacist = require("../../models/Pharmacist");
const { signer, userRegistry } = require("../../utils/blockchain"); 


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
          address: 1,
          country: 1,
          state: 1,
          city: 1,
          website: 1,
          workingRegions: 1,
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

    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false, message: "Invalid user ID" });

    const user = await User.findById(id);
    if (!user || user.role !== "pharmacist")
      return res.status(404).json({ success: false, message: "Pharmacist not found" });

    // Store original values for potential rollback
    const originalApproval = user.isApproved;
    const originalActive = user.isActive;

    // Update MongoDB
    user.isApproved = isApproved;
    user.isActive = isApproved;
    await user.save();

    // Update blockchain
    const RoleEnum = { None: 0, Superadmin: 1, Manufacturer: 2, Distributor: 3, Pharmacist: 4, Consumer: 5 };
    try {
      const tx = await userRegistry.setUser(user.address, isApproved, RoleEnum.Pharmacist);
      await tx.wait();
      console.log(`✅ UserRegistry: ${user.address} setApproval = ${isApproved}, role = Pharmacist`);
    } catch (err) {
      console.error("⚠️ Blockchain update failed:", err.message);
      
      // Rollback database changes
      try {
        user.isApproved = originalApproval;
        user.isActive = originalActive;
        await user.save();
        console.log(`🔄 Database rollback completed for ${user.address}`);
      } catch (rollbackErr) {
        console.error("❌ Database rollback failed:", rollbackErr.message);
      }
      
      return res.status(500).json({
        success: false,
        message: "Blockchain transaction failed. Database changes have been reverted.",
        error: err.message,
      });
    }

    res.status(200).json({
      success: true,
      message: `Pharmacist ${isApproved ? "approved" : "disapproved"} successfully (MongoDB + Blockchain)`,
      data: user,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

module.exports = {
  getAllPharmacists,
  approvePharmacist
};
