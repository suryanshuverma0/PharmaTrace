const Batch = require("../models/Batch");
const Product = require("../models/Product");
const BatchAssignment = require("../models/BatchAssignment");
const Distributor = require("../models/Distributor");
const { StatusCodes } = require('http-status-codes');

const assignBatchToDistributor = async (req, res) => {
  const { batchNumber } = req.params;
  const { distributorId, quantity, remarks } = req.body;

  try {
    // Validate input
    if (!distributorId || !quantity || quantity <= 0) {
      return res.status(400).json({
        message: "Distributor ID and valid quantity are required"
      });
    }

    // Get the batch
    const batch = await Batch.findOne({ batchNumber });
    if (!batch) {
      return res.status(404).json({ message: "Batch not found" });
    }

    // Verify manufacturer owns the batch
    if (batch.manufacturerId.toString() !== req.user.userId) {
      return res.status(403).json({
        message: "Not authorized to assign this batch"
      });
    }

    // Check available quantity
    if (batch.quantityAvailable < quantity) {
      return res.status(400).json({
        message: "Insufficient quantity available",
        available: batch.quantityAvailable
      });
    }

    // Get distributor details
    const distributor = await Distributor.findById(distributorId);
    if (!distributor) {
      return res.status(404).json({ message: "Distributor not found" });
    }

    // Get unassigned products from this batch
    const unassignedProducts = await Product.find({
      batchId: batch._id,
      status: 'produced',
      currentHolder: batch.manufacturerId
    }).limit(quantity);

    if (unassignedProducts.length < quantity) {
      return res.status(400).json({
        message: "Not enough unassigned products in batch"
      });
    }

    // Create batch assignment record
    const assignment = new BatchAssignment({
      batchId: batch._id,
      batchNumber: batch.batchNumber,
      manufacturerId: req.user.userId,
      distributorId: distributor._id,
      quantity,
      remarks,
      status: 'assigned',
      productIds: unassignedProducts.map(p => p._id),
      assignedAt: new Date(),
      shipmentStatus: 'Assigned',
      distributor: {
        name: distributor.companyName,
        address: distributor.address,
        license: distributor.licenseNumber
      }
    });

    // Update products' status and holder
    await Product.updateMany(
      { _id: { $in: unassignedProducts.map(p => p._id) } },
      { 
        $set: {
          status: 'assigned',
          currentHolder: distributor._id,
          assignedToDistributor: distributor._id
        },
        $push: {
          history: {
            timestamp: new Date(),
            action: 'assigned_to_distributor',
            from: batch.manufacturerId,
            to: distributor._id,
            location: distributor.address,
            actor: {
              id: req.user.userId,
              type: 'manufacturer'
            }
          }
        }
      }
    );

    // Update batch available quantity
    batch.quantityAvailable -= quantity;
    batch.assignments = batch.assignments || [];
    batch.assignments.push(assignment._id);

    // Save all changes
    await Promise.all([
      assignment.save(),
      batch.save()
    ]);

    res.status(200).json({
      message: "Batch assigned successfully",
      assignment
    });

  } catch (error) {
    console.error('Error assigning batch:', error);
    res.status(500).json({
      message: "Failed to assign batch",
      error: error.message
    });
  }
};

const getAssignments = async (req, res) => {
  try {
    const assignments = await BatchAssignment.find({
      manufacturerId: req.user.userId
    })
    .populate('distributorId', 'companyName address licenseNumber')
    .sort('-assignedAt');

    res.json(assignments);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch assignments",
      error: error.message
    });
  }
};

const updateAssignmentStatus = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { status, remarks } = req.body;

    const assignment = await BatchAssignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    if (assignment.manufacturerId.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    assignment.status = status;
    if (remarks) assignment.remarks = remarks;
    assignment.lastUpdated = new Date();

    // Update products status
    await Product.updateMany(
      { _id: { $in: assignment.productIds } },
      {
        $set: { status: status.toLowerCase() },
        $push: {
          history: {
            timestamp: new Date(),
            action: `status_updated_to_${status.toLowerCase()}`,
            actor: {
              id: req.user.userId,
              type: 'manufacturer'
            },
            remarks
          }
        }
      }
    );

    await assignment.save();

    res.json({
      message: "Assignment updated successfully",
      assignment
    });

  } catch (error) {
    res.status(500).json({
      message: "Failed to update assignment",
      error: error.message
    });
  }
};

module.exports = {
  assignBatchToDistributor,
  getAssignments,
  updateAssignmentStatus
};
