const getManufacturerProducts = async (req, res) => {
  try {
    // First get all batches for the manufacturer
    const batches = await Batch.find({ manufacturerId: req.user.userId })
      .sort('-createdAt');

    // For each batch, get its products
    const batchesWithProducts = await Promise.all(batches.map(async (batch) => {
      const products = await Product.find({ 
        manufacturerId: req.user.userId,
        batchNumber: batch.batchNumber 
      }).sort('-createdAt');

      return {
        _id: batch._id,
        batchNumber: batch.batchNumber,
        manufactureDate: batch.manufactureDate,
        expiryDate: batch.expiryDate,
        quantityProduced: batch.quantityProduced,
        quantityAvailable: batch.quantityAvailable,
        dosageForm: batch.dosageForm,
        strength: batch.strength,
        storageConditions: batch.storageConditions,
        productionLocation: batch.productionLocation,
        shipmentStatus: batch.shipmentStatus,
        products: products.map(product => ({
          _id: product._id,
          productName: product.productName,
          serialNumber: product.serialNumber,
          drugCode: product.drugCode,
          price: product.price,
          qrCodeUrl: product.qrCodeUrl,
          fingerprint: product.fingerprint
        }))
      };
    }));

    res.json(batchesWithProducts);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Failed to fetch products', error: error.message });
  }
};
