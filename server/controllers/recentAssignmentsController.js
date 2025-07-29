const BatchAssignment = require("../models/BatchAssignment");

const getRecentAssignments = async (req, res) => {
  try {
    const assignments = await BatchAssignment.find({
      manufacturerId: req.user.userId
    })
    .populate('distributorId', 'companyName address licenseNumber')
    .populate('batchId', 'batchNumber quantityProduced quantityAvailable')
    .sort('-assignedAt')
    .limit(10);

    // Get tracking summary for each assignment
    const assignmentsWithTracking = await Promise.all(assignments.map(async (assignment) => {
      const recentTracking = assignment.tracking
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 3);

      const productsInTransit = await Product.countDocuments({
        _id: { $in: assignment.productIds },
        status: 'in_transit'
      });

      const productsDelivered = await Product.countDocuments({
        _id: { $in: assignment.productIds },
        status: 'delivered'
      });

      return {
        ...assignment.toObject(),
        tracking: {
          recent: recentTracking,
          summary: {
            total: assignment.quantity,
            inTransit: productsInTransit,
            delivered: productsDelivered
          }
        }
      };
    }));

    res.json({
      assignments: assignmentsWithTracking
    });
  } catch (error) {
    console.error('Error fetching recent assignments:', error);
    res.status(500).json({
      message: "Failed to fetch recent assignments",
      error: error.message
    });
  }
};

module.exports = { getRecentAssignments };
