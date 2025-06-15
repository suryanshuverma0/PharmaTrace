// contracts/ProductRegistry.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ProductRegistry {
    struct Product {
        string name;
        string serialNumber;
        string batchNumber;
        uint256 manufactureDate;
        uint256 expiryDate;
        string manufacturerName;
        string manufacturerLicense;
        string productionLocation;
        string drugCode;
        string dosageForm;
        string strength;
        string storageCondition;
        string approvalCertificateId;
        string manufacturerCountry;
        address manufacturerAddress;
    }

    mapping(string => Product) public products;

    function registerProduct(
        string memory name,
        string memory serialNumber,
        string memory batchNumber,
        uint256 manufactureDate,
        uint256 expiryDate,
        string memory manufacturerName,
        string memory manufacturerLicense,
        string memory productionLocation,
        string memory drugCode,
        string memory dosageForm,
        string memory strength,
        string memory storageCondition,
        string memory approvalCertificateId,
        string memory manufacturerCountry
    ) public {
        products[serialNumber] = Product(
            name,
            serialNumber,
            batchNumber,
            manufactureDate,
            expiryDate,
            manufacturerName,
            manufacturerLicense,
            productionLocation,
            drugCode,
            dosageForm,
            strength,
            storageCondition,
            approvalCertificateId,
            manufacturerCountry,
            msg.sender
        );
    }
}
