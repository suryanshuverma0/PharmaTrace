# PharmaTrace

A blockchain-powered pharmaceutical supply chain management platform for secure, transparent, and efficient tracking of medicines from manufacturer to pharmacy.

## Features
- **Blockchain Integration:** Immutable tracking of batches and products using smart contracts (Solidity, Hardhat).
- **Role-Based Dashboards:** Separate interfaces for manufacturers, distributors, pharmacies, and consumers.
- **Batch & Product Management:** Register, assign, and track batches and products with full shipment and transfer history.
- **Inventory & Shipment Tracking:** Real-time inventory, shipment acknowledgment, and transfer tracking for distributors and pharmacies.
- **Medicine Verification & Journey Tracking:** 
  - QR code-based medicine authenticity verification
  - Complete supply chain journey visualization
  - Environmental conditions monitoring (temperature, humidity)
  - Quality control and testing data
  - Regulatory compliance verification
- **Authentication & Authorization:** Secure login and protected routes for all user roles.
- **Modern UI:** Built with React, Tailwind CSS, and Vite for a fast, responsive experience.

## Tech Stack
- **Frontend:** React, Vite, Tailwind CSS
- **Backend:** Node.js, Express, MongoDB (Mongoose)
- **Blockchain:** Solidity, Hardhat, Ethers.js

## Project Structure
```
PharmaTrace/
├── blockchain/      # Smart contracts, Hardhat config, deployment scripts
├── client/          # React frontend (Vite, Tailwind, role-based pages)
├── server/          # Node.js/Express backend, MongoDB models, API routes
└── README.md
```

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB (local or Atlas)
- Hardhat (for blockchain dev)

### 1. Clone the Repository
```sh
git clone https://github.com/suryanshuverma0/PharmaTrace.git
cd PharmaTrace
```

### 2. Install Dependencies
- **Blockchain:**
  ```sh
  cd blockchain
  npm install
  ```
- **Backend:**
  ```sh
  cd ../server
  npm install
  ```
- **Frontend:**
  ```sh
  cd ../client
  npm install
  ```

### 3. Configure Environment
- Copy `.env.example` to `.env` in `server/` and set MongoDB URI and other secrets.
- Configure blockchain network and accounts in `blockchain/hardhat.config.js` as needed.

### 4. Run the Blockchain (Hardhat Local Node)
```sh
cd blockchain
npx hardhat node
```

### 5. Deploy Smart Contracts
```sh
npx hardhat run scripts/deploy.js --network localhost
```

### 6. Start the Backend Server
```sh
cd ../server
npm start
```

### 7. Start the Frontend
```sh
cd ../client
npm run dev
```

## Usage
- Register as a manufacturer, distributor, pharmacy, or consumer.
- Manufacturers can register products and batches, assign batches to distributors.
- Distributors can acknowledge shipments, manage inventory, and transfer to pharmacies.
- Pharmacies can receive shipments and manage their inventory.
- All actions are tracked and visible in the shipment/transfer history.
- End-users (consumers) can:
  - Scan product QR codes to verify authenticity
  - View complete medicine journey from manufacturer to pharmacy
  - Check quality control data and storage conditions
  - Verify regulatory compliance and testing results
  - Access detailed product information and expiry dates

## Contributing
Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## License
[MIT](LICENSE)

## Links
