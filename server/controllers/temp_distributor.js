const getAssignedBatches = async (req, res) => {
  try {
    // Get the distributor's details including their blockchain address
    const distributor = await Distributor.findOne({ user: req.user.userId });
    if (!distributor) {
      return res.status(404).json({ message: "Distributor not found" });
    }

    // Find all batches where this distributor appears in shipment history
    const assignedBatches = await Batch.find({
      'shipmentHistory': {
        $elemMatch: {
          'to': distributor.companyName,
          'actor.type': 'Manufacturer' // Ensures it's assigned by manufacturer
        }
      }
    }).sort('-shipmentHistory.timestamp');

    // Format the response data
    const formattedBatches = assignedBatches.map(batch => {
      // Get the latest shipment entry for this distributor
      const latestShipment = batch.shipmentHistory
        .filter(sh => sh.to === distributor.companyName)
        .sort((a, b) => b.timestamp - a.timestamp)[0];

      return {
        _id: batch._id,
        batchNumber: batch.batchNumber,
        productDetails: `${batch.dosageForm} ${batch.strength}`,
        manufactureDate: batch.manufactureDate,
        expiryDate: batch.expiryDate,
        manufacturer: latestShipment.from,
        manufacturerAddress: batch.manufacturerAddress,
        assignedQuantity: parseInt(latestShipment.quantity),
        assignedAt: latestShipment.timestamp,
        status: batch.shipmentStatus,
        remarks: latestShipment.remarks || '',
        environmentalConditions: latestShipment.environmentalConditions || {},
        qualityCheck: latestShipment.qualityCheck || {}
      };
    });

    res.status(200).json({ batches: formattedBatches });
  } catch (error) {
    console.error('Error fetching assigned batches:', error);
    res.status(500).json({ 
      message: 'Failed to fetch assigned batches',
      error: error.message 
    });
  }
};
