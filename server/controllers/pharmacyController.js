const mongoose = require('mongoose');
const Pharmacist = require('../models/Pharmacist');
const User = require('../models/User');

const getAllPharmacies = async (req, res) => {
  try {
    // Perform aggregation to fetch pharmacies with associated user data
    const pharmacies = await Pharmacist.aggregate([
      {
        $lookup: {
          from: 'users', // Collection name in MongoDB (lowercase, plural)
          localField: 'user',
          foreignField: '_id',
          as: 'userData'
        }
      },
      {
        $unwind: {
          path: '$userData',
          preserveNullAndEmptyArrays: false // Only include pharmacists with matching users
        }
      },
      {
        $match: {
          'userData.isActive': true // Only include active users
        }
      },
      {
        $project: {
          userId: '$userData._id',
          address: '$userData.address',
          pharmacyId: '$_id',
          pharmacyName: 1,
          pharmacyLocation: 1
        }
      }
    ]);

    console.log('Fetched pharmacies:', pharmacies.length);

    res.status(200).json({
      success: true,
      data: pharmacies
    });
  } catch (error) {
    console.error('Error fetching pharmacies:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pharmacies',
      details: error.message
    });
  }
};

module.exports = { getAllPharmacies };