const mongoose = require("mongoose");
const User = require("../../models/User");
const Manufacturer = require("../../models/Manufacturer");
const { signer, userRegistry } = require("../../utils/blockchain"); 

// Get all manufacturers with user details
const getAllManufacturers = async (req, res) => {
  try {
    const manufacturers = await User.aggregate([
      { $match: { role: "manufacturer" } },
      {
        $lookup: {
          from: "manufacturers",
          localField: "_id",
          foreignField: "user",
          as: "manufacturerDetails"
        }
      },
      { $unwind: { path: "$manufacturerDetails", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          name: 1,
          username: 1,
          email: 1,
          phone: 1,
          role: 1,
          country: 1,
          state: 1,
          city: 1,
          address: 1,
          website: 1,
          isApproved: 1,
          createdAt: 1,
          manufacturer: {
            companyName: "$manufacturerDetails.companyName",
            registrationNumber: "$manufacturerDetails.registrationNumber",
            licenseDocument: "$manufacturerDetails.licenseDocument",
            certifications: "$manufacturerDetails.certifications",
          }
        }
      },
      { $sort: { createdAt: -1 } }
    ]);

    res.status(200).json({ success: true, count: manufacturers.length, data: manufacturers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};


const approveManufacturer = async (req, res) => {
  try {
    const { id } = req.params;
    const { isApproved } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false, message: "Invalid user ID" });

    const user = await User.findById(id);
    if (!user || user.role !== "manufacturer")
      return res.status(404).json({ success: false, message: "Manufacturer not found" });

    // Update MongoDB
    user.isApproved = isApproved;
    user.isActive = isApproved;
    await user.save();

    // Update blockchain
    const RoleEnum = { None: 0, Superadmin: 1, Manufacturer: 2, Distributor: 3, Pharmacist: 4 };
    try {
      const tx = await userRegistry.setUser(user.address, isApproved, RoleEnum.Manufacturer);
      await tx.wait();
      console.log(`✅ UserRegistry: ${user.address} setApproval = ${isApproved}, role = Manufacturer`);
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
      message: `Manufacturer ${isApproved ? "approved" : "disapproved"} successfully (MongoDB + Blockchain)`,
      data: user,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
}; 


module.exports = {
  getAllManufacturers,
  approveManufacturer
};
