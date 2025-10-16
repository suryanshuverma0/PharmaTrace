// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract UserRegistry {
    address public admin;

    enum Role {
        None,
        Superadmin,
        Manufacturer,
        Distributor,
        Pharmacist, 
        Consumer
    }

    struct UserInfo {
        bool isApproved;
        Role role;
    }

    mapping(address => UserInfo) public users;

    event UserWhitelisted(address indexed user, bool isApproved, Role role);
    event AdminChanged(address indexed oldAdmin, address indexed newAdmin);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Not authorized");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    // Set or update approval and role
    function setUser(
        address user,
        bool approved,
        Role role
    ) external onlyAdmin {
        users[user].isApproved = approved;
        users[user].role = role;
        emit UserWhitelisted(user, approved, role);
    }

    function isUserApproved(address user) external view returns (bool) {
        return users[user].isApproved;
    }

    function getUserRole(address user) external view returns (Role) {
        return users[user].role;
    }
}
