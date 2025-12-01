// contracts/BatchRegistry.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract BatchRegistry {
    struct Batch {
        string batchNumber;
        uint256 manufactureDate;
        uint256 expiryDate;
        uint256 quantityProduced;
        uint256 quantityAvailable;
        string dosageForm;
        string strength;
        string manufacturerName;
        address manufacturerAddress;
        uint256 registrationTimestamp;
        bool isActive;
        string digitalFingerprint;
        bool distributorVerified;
        bool pharmacistVerified;
    }

    struct ShipmentEntry {
        uint256 timestamp;
        string from;
        string to;
        address fromAddress;
        address toAddress;
        string status;
        uint256 quantity;
        string remarks;
    }

    // Mapping from batch number to batch details
    mapping(string => Batch) public batches;
    
    // Mapping from digital fingerprint to batch details
    mapping(string => Batch) public batchesByFingerprint;
    
    // Mapping from batch number to digital fingerprint
    mapping(string => string) public batchToFingerprint;
    
    // Mapping to track all batch numbers by manufacturer
    mapping(address => string[]) public manufacturerBatches;
    
    // Mapping to track shipment history for each batch
    mapping(string => ShipmentEntry[]) public batchShipmentHistory;
    
    // Array to store all batch numbers
    string[] public allBatchNumbers;
    
    // Array to store all batch fingerprints
    string[] public allBatchFingerprints;

    // Events
    event BatchRegistered(
        string indexed batchNumber,
        address indexed manufacturerAddress,
        uint256 quantityProduced,
        uint256 registrationTimestamp
    );

    event BatchQuantityUpdated(
        string indexed batchNumber,
        uint256 oldQuantity,
        uint256 newQuantity,
        uint256 timestamp
    );

    event BatchDeactivated(
        string indexed batchNumber,
        address indexed manufacturerAddress,
        uint256 timestamp
    );

    // Register a new batch - simplified version
    function registerBatch(
        string memory batchNumber,
        uint256 manufactureDate,
        uint256 expiryDate,
        uint256 quantityProduced,
        string memory dosageForm,
        string memory strength,
        string memory manufacturerName
    ) public {
        // Validate that batch doesn't already exist
        require(batches[batchNumber].manufacturerAddress == address(0), "Batch already exists");
        
        // Validate dates
        require(expiryDate > manufactureDate, "Expiry date must be after manufacture date");
        require(manufactureDate <= block.timestamp, "Manufacture date cannot be in the future");
        
        // Validate quantity
        require(quantityProduced > 0, "Quantity produced must be greater than 0");

        // Generate digital fingerprint
        string memory digitalFingerprint = generateBatchFingerprint(
            batchNumber,
            manufacturerName,
            quantityProduced,
            block.timestamp
        );

        // Create batch struct
        batches[batchNumber] = Batch({
            batchNumber: batchNumber,
            manufactureDate: manufactureDate,
            expiryDate: expiryDate,
            quantityProduced: quantityProduced,
            quantityAvailable: quantityProduced,
            dosageForm: dosageForm,
            strength: strength,
            manufacturerName: manufacturerName,
            manufacturerAddress: msg.sender,
            registrationTimestamp: block.timestamp,
            isActive: true,
            digitalFingerprint: digitalFingerprint,
            distributorVerified: false,
            pharmacistVerified: false
        });

        // Store in fingerprint mapping
        batchesByFingerprint[digitalFingerprint] = batches[batchNumber];
        batchToFingerprint[batchNumber] = digitalFingerprint;

        // Add to manufacturer's batch list
        manufacturerBatches[msg.sender].push(batchNumber);
        
        // Add to all batches list
        allBatchNumbers.push(batchNumber);
        allBatchFingerprints.push(digitalFingerprint);

        // Emit event
        emit BatchRegistered(batchNumber, msg.sender, quantityProduced, block.timestamp);
    }

    // Update batch quantity (when products are created from this batch)
    function updateBatchQuantity(string memory batchNumber, uint256 newQuantityAvailable) public {
        require(batches[batchNumber].manufacturerAddress == msg.sender, "Only batch manufacturer can update quantity");
        require(batches[batchNumber].isActive, "Batch is not active");
        require(newQuantityAvailable <= batches[batchNumber].quantityProduced, "Available quantity cannot exceed produced quantity");

        uint256 oldQuantity = batches[batchNumber].quantityAvailable;
        batches[batchNumber].quantityAvailable = newQuantityAvailable;

        emit BatchQuantityUpdated(batchNumber, oldQuantity, newQuantityAvailable, block.timestamp);
    }

    // Deactivate a batch (in case of recall or other issues)
    function deactivateBatch(string memory batchNumber) public {
        require(batches[batchNumber].manufacturerAddress == msg.sender, "Only batch manufacturer can deactivate");
        require(batches[batchNumber].isActive, "Batch is already inactive");

        batches[batchNumber].isActive = false;

        emit BatchDeactivated(batchNumber, msg.sender, block.timestamp);
    }

    // Get batch details
    function getBatch(string memory batchNumber) public view returns (Batch memory) {
        require(batches[batchNumber].manufacturerAddress != address(0), "Batch does not exist");
        return batches[batchNumber];
    }

    // Get all batch numbers for a manufacturer
    function getManufacturerBatches(address manufacturer) public view returns (string[] memory) {
        return manufacturerBatches[manufacturer];
    }

    // Get total number of batches
    function getTotalBatches() public view returns (uint256) {
        return allBatchNumbers.length;
    }

    // Check if batch exists and is active
    function isBatchActive(string memory batchNumber) public view returns (bool) {
        return batches[batchNumber].manufacturerAddress != address(0) && batches[batchNumber].isActive;
    }

    // Get available quantity for a batch
    function getBatchAvailableQuantity(string memory batchNumber) public view returns (uint256) {
        require(batches[batchNumber].manufacturerAddress != address(0), "Batch does not exist");
        return batches[batchNumber].quantityAvailable;
    }

    // Generate digital fingerprint for batch
    function generateBatchFingerprint(
        string memory batchNumber,
        string memory manufacturerName,
        uint256 quantityProduced,
        uint256 timestamp
    ) internal pure returns (string memory) {
        return string(abi.encodePacked(
            batchNumber, 
            manufacturerName, 
            quantityProduced, 
            timestamp
        ));
    }

    // Get batch by digital fingerprint
    function getBatchByFingerprint(string memory fingerprint) public view returns (Batch memory) {
        require(bytes(batchesByFingerprint[fingerprint].batchNumber).length > 0, "Batch not found");
        return batchesByFingerprint[fingerprint];
    }

    // Get digital fingerprint by batch number
    function getFingerprintByBatch(string memory batchNumber) public view returns (string memory) {
        require(bytes(batchToFingerprint[batchNumber]).length > 0, "Batch number not found");
        return batchToFingerprint[batchNumber];
    }

    // Add shipment entry to batch history - simplified
    function addShipmentEntry(
        string memory batchNumber,
        string memory from,
        string memory to,
        address fromAddress,
        address toAddress,
        string memory status,
        uint256 quantity,
        string memory remarks
    ) public {
        require(batches[batchNumber].manufacturerAddress != address(0), "Batch does not exist");
        
        ShipmentEntry memory entry = ShipmentEntry({
            timestamp: block.timestamp,
            from: from,
            to: to,
            fromAddress: fromAddress,
            toAddress: toAddress,
            status: status,
            quantity: quantity,
            remarks: remarks
        });

        batchShipmentHistory[batchNumber].push(entry);
    }

    // Get shipment history for a batch
    function getBatchShipmentHistory(string memory batchNumber) public view returns (ShipmentEntry[] memory) {
        require(batches[batchNumber].manufacturerAddress != address(0), "Batch does not exist");
        return batchShipmentHistory[batchNumber];
    }

    // Get shipment history length for a batch
    function getBatchShipmentHistoryLength(string memory batchNumber) public view returns (uint256) {
        require(batches[batchNumber].manufacturerAddress != address(0), "Batch does not exist");
        return batchShipmentHistory[batchNumber].length;
    }

    // Verify batch by distributor
    function verifyByDistributor(string memory batchNumber) public {
        require(batches[batchNumber].manufacturerAddress != address(0), "Batch does not exist");
        require(!batches[batchNumber].distributorVerified, "Already verified by distributor");
        
        batches[batchNumber].distributorVerified = true;
        batchesByFingerprint[batchToFingerprint[batchNumber]].distributorVerified = true;
    }

    // Verify batch by pharmacist
    function verifyByPharmacist(string memory batchNumber) public {
        require(batches[batchNumber].manufacturerAddress != address(0), "Batch does not exist");
        require(!batches[batchNumber].pharmacistVerified, "Already verified by pharmacist");
        
        batches[batchNumber].pharmacistVerified = true;
        batchesByFingerprint[batchToFingerprint[batchNumber]].pharmacistVerified = true;
    }

    // Get verification status
    function getVerificationStatus(string memory batchNumber) public view returns (
        bool distributorVerified,
        bool pharmacistVerified
    ) {
        require(batches[batchNumber].manufacturerAddress != address(0), "Batch does not exist");
        return (
            batches[batchNumber].distributorVerified,
            batches[batchNumber].pharmacistVerified
        );
    }
}