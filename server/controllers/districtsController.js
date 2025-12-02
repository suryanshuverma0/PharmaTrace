// controllers/nepalController.js
const infoNepal = require("info-nepal");

// Get list of all districts
const getAllDistricts = (req, res) => {
  try {
    const districts = infoNepal.allDistricts; // returns array of districts
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
