const PharmacyAssignment = require('../models/PharmacyAssignment');
const BatchAssignment = require('../models/BatchAssignment');
const Pharmacist = require('../models/Pharmacist');
const Batch = require('../models/Batch');
const User = require('../models/User');

// Get all approved pharmacies with details
const getApprovedPharmacies = async (req, res) => {
  try {
    const pharmacies = await Pharmacist.find()
      .populate({
        path: 'user',
        match: { isApproved: true, isActive: true },
        select: 'name email phone address country state city'
      });

    // Filter out pharmacies without approved users
    const approvedPharmacies = pharmacies
      .filter(p => p.user !== null)
      .map(p => ({
        id: p._id,
        userId: p.user._id,
        name: p.pharmacyName,
        licenseNumber: p.licenseNumber,
        location: p.pharmacyLocation || `${p.user.city}, ${p.user.state}, ${p.user.country}`,
        contact: {
          name: p.user.name,
          email: p.user.email,
          phone: p.user.phone,
          address: p.user.address
        }
      }));

    res.json({ pharmacies: approvedPharmacies });
  } catch (error) {
    console.error('Error fetching pharmacies:', error);
    res.status(500).json({ message: 'Failed to fetch pharmacies', error: error.message });
  }
};

// Get available batches for distribution
const getAvailableBatches = async (req, res) => {
  try {
    const distributorId = req.query.distributorId;
    
    // Find batch assignments for this distributor that are delivered
    const assignments = await BatchAssignment.find({
      distributorId,
      status: 'delivered'
    }).populate('batchId');

    // Calculate available quantities
    const availableBatches = await Promise.all(assignments.map(async (assignment) => {
      // Get total distributed to pharmacies
      const distributedQty = await PharmacyAssignment.aggregate([
        {
          $match: {
            batchAssignmentId: assignment._id,
            status: { $ne: 'cancelled' }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$quantity' }
          }
        }
      ]);

      const distributed = distributedQty[0]?.total || 0;
      const available = assignment.quantity - distributed;

      if (available <= 0) return null;

      return {
        batchAssignmentId: assignment._id,
        batchId: assignment.batchId._id,
        batchNumber: assignment.batchId.batchNumber,
        product: assignment.batchId.dosageForm + ' ' + assignment.batchId.strength,
        manufacturingDate: assignment.batchId.manufacturingDate,
        expiryDate: assignment.batchId.expiryDate,
        quantity: available,
        total: assignment.quantity,
        distributed: distributed
      };
    }));

    res.json({
      batches: availableBatches.filter(b => b !== null)
    });
  } catch (error) {
    console.error('Error fetching available batches:', error);
    res.status(500).json({ message: 'Failed to fetch batches', error: error.message });
  }
};

// Assign batch to pharmacy
const assignToPharmacy = async (req, res) => {
  const {
    batchAssignmentId,
    pharmacistId,
    quantity,
    remarks
  } = req.body;

  if (!batchAssignmentId || !pharmacistId || !quantity) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    // Get the batch assignment
    const batchAssignment = await BatchAssignment.findById(batchAssignmentId)
      .populate('batchId');
    if (!batchAssignment) {
      return res.status(404).json({ message: 'Batch assignment not found' });
    }

    // Get the pharmacy details
    const pharmacy = await Pharmacist.findById(pharmacistId)
      .populate('user');
    if (!pharmacy) {
      return res.status(404).json({ message: 'Pharmacy not found' });
    }

    // Check available quantity
    const distributedQty = await PharmacyAssignment.aggregate([
      {
        $match: {
          batchAssignmentId: batchAssignment._id,
          status: { $ne: 'cancelled' }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$quantity' }
        }
      }
    ]);

    const distributed = distributedQty[0]?.total || 0;
    const available = batchAssignment.quantity - distributed;

    if (quantity > available) {
      return res.status(400).json({
        message: `Insufficient quantity. Only ${available} units available.`
      });
    }

    // Create pharmacy assignment
    const assignment = new PharmacyAssignment({
      batchAssignmentId: batchAssignment._id,
      batchId: batchAssignment.batchId._id,
      distributorId: batchAssignment.distributorId,
      pharmacistId: pharmacy._id,
      quantity,
      remarks,
      pharmacy: {
        name: pharmacy.pharmacyName,
        location: pharmacy.pharmacyLocation || `${pharmacy.user.city}, ${pharmacy.user.state}, ${pharmacy.user.country}`,
        license: pharmacy.licenseNumber,
        contact: {
          name: pharmacy.user.name,
          email: pharmacy.user.email,
          phone: pharmacy.user.phone
        }
      }
    });

    // Update batch shipment history
    await Batch.findByIdAndUpdate(batchAssignment.batchId._id, {
      $push: {
        shipmentHistory: {
          timestamp: new Date(),
          from: batchAssignment.distributor.address,
          to: pharmacy.user.address,
          status: 'Assigned',
          quantity: quantity.toString(),
          remarks: remarks || 'Assigned to pharmacy',
          actor: {
            name: pharmacy.pharmacyName,
            type: 'pharmacy',
            license: pharmacy.licenseNumber,
            location: pharmacy.pharmacyLocation
          }
        }
      }
    });

    await assignment.save();

    res.status(201).json({
      message: 'Successfully assigned to pharmacy',
      assignment: {
        id: assignment._id,
        batchNumber: batchAssignment.batchId.batchNumber,
        quantity,
        pharmacy: assignment.pharmacy
      }
    });

  } catch (error) {
    console.error('Error assigning to pharmacy:', error);
    res.status(500).json({ message: 'Failed to assign batch', error: error.message });
  }
};

// Get distribution history
const getDistributionHistory = async (req, res) => {
  try {
    const distributorId = req.query.distributorId;
    
    const assignments = await PharmacyAssignment.find({ distributorId })
      .populate('batchId')
      .populate('pharmacistId')
      .sort('-assignedAt');

    const history = assignments.map(assignment => ({
      id: assignment._id,
      batchNumber: assignment.batchId.batchNumber,
      pharmacy: assignment.pharmacy,
      quantity: assignment.quantity,
      status: assignment.status,
      assignedAt: assignment.assignedAt,
      tracking: assignment.tracking
    }));

    res.json({ history });
  } catch (error) {
    console.error('Error fetching distribution history:', error);
    res.status(500).json({ message: 'Failed to fetch history', error: error.message });
  }
};

// Update shipment status
const updateShipmentStatus = async (req, res) => {
  const { assignmentId, status, location, description, temperature, humidity } = req.body;

  try {
    const assignment = await PharmacyAssignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Add tracking update
    assignment.tracking.push({
      status,
      location,
      timestamp: new Date(),
      description,
      environmentalConditions: {
        temperature: {
          value: temperature?.value,
          unit: temperature?.unit || '°C',
          status: temperature?.status
        },
        humidity: {
          value: humidity?.value,
          unit: humidity?.unit || '%',
          status: humidity?.status
        }
      }
    });

    assignment.status = status.toLowerCase();
    assignment.shipmentStatus = status;
    
    // Update batch shipment history
    await Batch.findByIdAndUpdate(assignment.batchId, {
      $push: {
        shipmentHistory: {
          timestamp: new Date(),
          from: assignment.pharmacy.contact.address,
          to: assignment.pharmacy.location,
          status,
          quantity: assignment.quantity.toString(),
          remarks: description,
          environmentalConditions: {
            temperature: temperature?.value + (temperature?.unit || '°C'),
            humidity: humidity?.value + (humidity?.unit || '%'),
            status: (temperature?.status === 'Critical' || humidity?.status === 'Critical') ? 'Critical' : 'Normal'
          }
        }
      }
    });

    await assignment.save();

    res.json({
      message: 'Shipment status updated successfully',
      status: assignment.status
    });
  } catch (error) {
    console.error('Error updating shipment status:', error);
    res.status(500).json({ message: 'Failed to update status', error: error.message });
  }
};

module.exports = {
  getApprovedPharmacies,
  getAvailableBatches,
  assignToPharmacy,
  getDistributionHistory,
  updateShipmentStatus
};
