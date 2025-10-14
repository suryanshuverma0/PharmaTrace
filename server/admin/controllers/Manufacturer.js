// const mongoose = require("mongoose");
// const User = require("../../models/User");
// const Manufacturer = require("../../models/Manufacturer");

// // Get all manufacturers with user details
// const getAllManufacturers = async (req, res) => {
//   try {
//     const manufacturers = await User.aggregate([
//       { $match: { role: "manufacturer" } },
//       {
//         $lookup: {
//           from: "manufacturers",
//           localField: "_id",
//           foreignField: "user",
//           as: "manufacturerDetails"
//         }
//       },
//       { $unwind: { path: "$manufacturerDetails", preserveNullAndEmptyArrays: true } },
//       {
//         $project: {
//           _id: 1,
//           name: 1,
//           email: 1,
//           role: 1,
//           country: 1,
//           isApproved: 1,
//           createdAt: 1,
//           manufacturer: {
//             companyName: "$manufacturerDetails.companyName",
//             registrationNumber: "$manufacturerDetails.registrationNumber",
//             licenseDocument: "$manufacturerDetails.licenseDocument",
//             certifications: "$manufacturerDetails.certifications",
//           }
//         }
//       },
//       { $sort: { createdAt: -1 } }
//     ]);

//     res.status(200).json({ success: true, count: manufacturers.length, data: manufacturers });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false, message: "Server error", error: err.message });
//   }
// };

// // Approve or disapprove a manufacturer
// const approveManufacturer = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { isApproved } = req.body;

//     if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: "Invalid user ID" });

//     const user = await User.findById(id);
//     if (!user || user.role !== "manufacturer") return res.status(404).json({ success: false, message: "Manufacturer not found" });

//     user.isApproved = isApproved;
//     await user.save();

//     res.status(200).json({
//       success: true,
//       message: `Manufacturer ${isApproved ? "approved" : "disapproved"} successfully`,
//       data: user
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false, message: "Server error", error: err.message });
//   }
// };

// module.exports = {
//   getAllManufacturers,
//   approveManufacturer
// };










const mongoose = require("mongoose");
const User = require("../../models/User");
const Manufacturer = require("../../models/Manufacturer");

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

// Approve or disapprove a manufacturer
const approveManufacturer = async (req, res) => {
  try {
    const { id } = req.params;
    const { isApproved } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false, message: "Invalid user ID" });

    const user = await User.findById(id);
    if (!user || user.role !== "manufacturer")
      return res.status(404).json({ success: false, message: "Manufacturer not found" });

    user.isApproved = isApproved;
    await user.save();

    res.status(200).json({
      success: true,
      message: `Manufacturer ${isApproved ? "approved" : "disapproved"} successfully`,
      data: user
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
