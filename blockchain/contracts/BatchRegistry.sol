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
        string storageConditions;
        string productionLocation;
        string approvalCertId;
        string manufacturerName;
        string manufacturerCountry;
        address manufacturerAddress;
        uint256 registrationTimestamp;
        bool isActive;
    }

    // Mapping from batch number to batch details
    mapping(string => Batch) public batches;
    
    // Mapping to track all batch numbers by manufacturer
    mapping(address => string[]) public manufacturerBatches;
    
    // Array to store all batch numbers
    string[] public allBatchNumbers;

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

    // Register a new batch
    function registerBatch(
        string memory batchNumber,
        uint256 manufactureDate,
        uint256 expiryDate,
        uint256 quantityProduced,
        string memory dosageForm,
        string memory strength,
        string memory storageConditions,
        string memory productionLocation,
        string memory approvalCertId,
        string memory manufacturerName,
        string memory manufacturerCountry
    ) public {
        // Validate that batch doesn't already exist
        require(batches[batchNumber].manufacturerAddress == address(0), "Batch already exists");
        
        // Validate dates
        require(expiryDate > manufactureDate, "Expiry date must be after manufacture date");
        require(manufactureDate <= block.timestamp, "Manufacture date cannot be in the future");
        
        // Validate quantity
        require(quantityProduced > 0, "Quantity produced must be greater than 0");

        // Create batch struct
        batches[batchNumber] = Batch({
            batchNumber: batchNumber,
            manufactureDate: manufactureDate,
            expiryDate: expiryDate,
            quantityProduced: quantityProduced,
            quantityAvailable: quantityProduced,
            dosageForm: dosageForm,
            strength: strength,
            storageConditions: storageConditions,
            productionLocation: productionLocation,
            approvalCertId: approvalCertId,
            manufacturerName: manufacturerName,
            manufacturerCountry: manufacturerCountry,
            manufacturerAddress: msg.sender,
            registrationTimestamp: block.timestamp,
            isActive: true
        });

        // Add to manufacturer's batch list
        manufacturerBatches[msg.sender].push(batchNumber);
        
        // Add to all batches list
        allBatchNumbers.push(batchNumber);

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
}