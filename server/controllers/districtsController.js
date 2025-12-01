// controllers/nepalController.js
const infoNepal = require("info-nepal");

// Get list of all districts
const getAllDistricts = (req, res) => {
  try {
    console.log("fetching all districts....")
    const districts = infoNepal.allDistricts; // returns array of districts
    console.log("Districts:", districts);
    res.status(200).json({
      success: true,
      total: districts.length,
      data: districts
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error });
  }
};

module.exports = { getAllDistricts };
