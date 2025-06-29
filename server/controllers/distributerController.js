const Distributor = require('../models/Distributor');


const getApprovedDistributors = async (req, res) => {
  try {
    const distributors = await Distributor.find()
      .populate({
        path: 'user',
        match: { isApproved: true },
        select: 'name email phone address role country state city isApproved'
      });

    // Filter out null users (i.e., not approved)
    const approvedDistributors = distributors.filter(d => d.user !== null);

    res.json(approvedDistributors);
  } catch (error) {
    console.error("Error fetching distributors:", error);
    res.status(500).json({ message: 'Failed to fetch approved distributors', error: error.message });
  }
};

module.exports = {
  getApprovedDistributors 
};