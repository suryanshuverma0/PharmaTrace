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
        string dosageForm;
        string strength;
        address manufacturerAddress;
        string digitalFingerprint;
        uint256 registrationTimestamp;
        bool isActive;
    }

    // Mapping from serial number to product details (legacy support)
    mapping(string => Product) public products;
    
    // Mapping from digital fingerprint to product details (new primary method)
    mapping(string => Product) public productsByFingerprint;
    
    // Mapping from serial number to digital fingerprint
    mapping(string => string) public serialToFingerprint;
    
    // Array to store all product fingerprints
    string[] public allProductFingerprints;

    // Events
    event ProductRegistered(
        string indexed fingerprint,
        string indexed serialNumber,
        string indexed batchNumber,
        address manufacturerAddress,
        uint256 registrationTimestamp
    );

    function registerProduct(
        string memory name,
        string memory serialNumber,
        string memory batchNumber,
        uint256 manufactureDate,
        uint256 expiryDate,
        string memory manufacturerName,
        string memory dosageForm,
        string memory strength
    ) public {
        // Generate digital fingerprint on-chain
        string memory digitalFingerprint = generateFingerprint(
            serialNumber,
            batchNumber,
            name,
            manufacturerName,
            block.timestamp
        );
        
        // Validate that product doesn't already exist
        require(bytes(productsByFingerprint[digitalFingerprint].serialNumber).length == 0, "Product fingerprint already exists");
        require(bytes(products[serialNumber].serialNumber).length == 0, "Serial number already exists");

        Product memory newProduct = Product({
            name: name,
            serialNumber: serialNumber,
            batchNumber: batchNumber,
            manufactureDate: manufactureDate,
            expiryDate: expiryDate,
            manufacturerName: manufacturerName,
            dosageForm: dosageForm,
            strength: strength,
            manufacturerAddress: msg.sender,
            digitalFingerprint: digitalFingerprint,
            registrationTimestamp: block.timestamp,
            isActive: true
        });

        // Store in both mappings for backwards compatibility and fingerprint lookup
        products[serialNumber] = newProduct;
        productsByFingerprint[digitalFingerprint] = newProduct;
        serialToFingerprint[serialNumber] = digitalFingerprint;
        allProductFingerprints.push(digitalFingerprint);

        emit ProductRegistered(digitalFingerprint, serialNumber, batchNumber, msg.sender, block.timestamp);
    }

    // Generate digital fingerprint (simplified version)
    function generateFingerprint(
        string memory serialNumber,
        string memory batchNumber,
        string memory name,
        string memory manufacturerName,
        uint256 timestamp
    ) internal pure returns (string memory) {
        return string(abi.encodePacked(
            serialNumber, 
            batchNumber, 
            name, 
            manufacturerName, 
            timestamp
        ));
    }

    // Get product by digital fingerprint
    function getProductByFingerprint(string memory fingerprint) public view returns (Product memory) {
        require(bytes(productsByFingerprint[fingerprint].serialNumber).length > 0, "Product not found");
        return productsByFingerprint[fingerprint];
    }

    // Get digital fingerprint by serial number
    function getFingerprintBySerial(string memory serialNumber) public view returns (string memory) {
        require(bytes(serialToFingerprint[serialNumber]).length > 0, "Serial number not found");
        return serialToFingerprint[serialNumber];
    }

    // Check if product exists by fingerprint
    function productExistsByFingerprint(string memory fingerprint) public view returns (bool) {
        return bytes(productsByFingerprint[fingerprint].serialNumber).length > 0;
    }

    // Get total number of products
    function getTotalProducts() public view returns (uint256) {
        return allProductFingerprints.length;
    }
}
