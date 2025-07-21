# NFT Certificate System

This project is a fullstack DApp for issuing, viewing, and managing NFT-based certificates using Ethereum smart contracts, React frontend, and a Node.js backend.

## 1. Deploy the Smart Contract (Local Network)

### Start a local Ethereum node (Hardhat)
```bash
npx hardhat node
```

### In a new terminal, deploy the contract
```bash
npx hardhat run contracts/deploy.js --network localhost
```

## 2. Start the Backend Server

```bash
cd backend
npm start
```

- The backend will run on [http://localhost:5002](http://localhost:5002) by default.

## 3. Start the Frontend

```bash
cd frontend
npm start
```

- The frontend will run on [http://localhost:3000](http://localhost:3000) by default.

## 4. Using the DApp

- Open [http://localhost:3000](http://localhost:3000) in your browser.
- Connect your MetaMask wallet (ensure it's on the local Hardhat network).
- Use the Admin interface to mint, batch mint, and manage certificates.
- Students and employers can view and verify certificates.
