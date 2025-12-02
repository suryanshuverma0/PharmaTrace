const User = require("../models/User");

/**
 * @desc    Get all users with working regions for map visualization
 * @route   GET /api/admin/user-map
 * @access  Admin
 */
const getUserMapData = async (req, res) => {
  try {
    // Fetch all users with required roles and their working regions with aggregation to get company details
    const users = await User.aggregate([
      { 
        $match: { 
          role: { $in: ['manufacturer', 'distributor', 'pharmacist'] },
          workingRegions: { $exists: true, $ne: [] }
        }
      },
      {
        $lookup: {
          from: "manufacturers",
          localField: "_id",
          foreignField: "user",
          as: "manufacturerDetails"
        }
      },
      {
        $lookup: {
          from: "distributors", 
          localField: "_id",
          foreignField: "user",
          as: "distributorDetails"
        }
      },
      {
        $lookup: {
          from: "pharmacists",
          localField: "_id", 
          foreignField: "user",
          as: "pharmacistDetails"
        }
      },
      {
        $addFields: {
          companyName: {
            $switch: {
              branches: [
                { 
                  case: { $eq: ["$role", "manufacturer"] },
                  then: { $arrayElemAt: ["$manufacturerDetails.companyName", 0] }
                },
                {
                  case: { $eq: ["$role", "distributor"] }, 
                  then: { $arrayElemAt: ["$distributorDetails.companyName", 0] }
                },
                {
                  case: { $eq: ["$role", "pharmacist"] },
                  then: { $arrayElemAt: ["$pharmacistDetails.pharmacyName", 0] }
                }
              ],
              default: "$name"
            }
          }
        }
      },
      {
        $project: {
          name: 1,
          address: 1,
          role: 1,
          workingRegions: 1,
          city: 1,
          state: 1,
          country: 1,
          isApproved: 1,
          isActive: 1,
          createdAt: 1,
          email: 1,
          phone: 1,
          companyName: 1
        }
      }
    ]);

    // Group users by role for easier frontend consumption
    const groupedUsers = {
      manufacturers: users.filter(user => user.role === 'manufacturer'),
      distributors: users.filter(user => user.role === 'distributor'),
      pharmacists: users.filter(user => user.role === 'pharmacist')
    };

    // Calculate statistics
    const stats = {
      totalUsers: users.length,
      totalManufacturers: groupedUsers.manufacturers.length,
      totalDistributors: groupedUsers.distributors.length,
      totalPharmacists: groupedUsers.pharmacists.length,
      totalRegions: [...new Set(users.flatMap(user => user.workingRegions))].length,
      activeRegions: [...new Set(
        users
          .filter(user => user.isActive && user.isApproved)
          .flatMap(user => user.workingRegions)
      )].length
    };

    res.status(200).json({ 
      success: true, 
      data: groupedUsers,
      stats: stats,
      count: users.length 
    });
    
  } catch (err) {
    console.error("Error fetching user map data:", err);
    res.status(500).json({ 
      success: false, 
      message: "Server error", 
      error: err.message 
    });
  }
};

module.exports = {
  getUserMapData
};