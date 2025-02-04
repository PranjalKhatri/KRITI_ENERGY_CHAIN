# EnergyChain Challenge

## Overview
The energy sector faces critical challenges, including energy security, energy equity, and environmental sustainability. Traditional energy systems suffer from monopolistic conditions, opaque carbon credit trading, and limited participation of small-scale renewable energy producers.

This project leverages **blockchain technology enhanced with ZK-SNARKs** to enable transparent, secure, and decentralized peer-to-peer (P2P) energy trading. By integrating **smart meters, IoT devices like sensors, and smart contracts**, the system ensures **real-time verification, efficient and sustainable energy distribution, and privacy-preserving transactions**.

The primary goals of this project are:
- **Decentralized Energy Trading:** Enabling prosumers to directly participate in energy markets using blockchain-based verification.
- **Automated Carbon Credit Trading:** Promoting more and more sustainable producers.
- **Smart Contract-Based Settlements:** Implementing automated trading and settlement mechanisms.
- **IoT Integration:** Using smart meters to accurately monitor energy consumption and send signal to start the verification of Energy Transfer.
- **Privacy Protection:** Implementing **ZK-SNARKs** to secure sensitive trading data and verify the energy transfer.
- **Scalability & Accessibility:** Reducing barriers for small-scale renewable energy producers and ensuring profit of both the parties i.e., buyer and seller to ensure equitable market participation ensuring scalability of the model.

## Key Features
- **Blockchain-Based Smart Grid:** Provides a transparent and immutable energy trading ecosystem.
- **P2P Energy Transactions:** Eliminates intermediaries, ensuring fair market participation.
- **IoT & Smart Meter Integration:** Tracks real-time energy usage efficiently.
- **Carbon Credit Verification:** Uses robust mechanisms to ensure authenticity.
- **Automated Order Matching & Settlement:** Smart contracts handle real-time energy trading.
- **Privacy-Preserving Technology:** ZK-SNARKs protect confidential transaction data.

## System Components
1. **Blockchain Layer**
   - Smart contracts for trading and settlements
   - Consensus mechanism for transaction validation
   - Transparent and immutable ledger
2. **Smart Grid Management**
   - IoT and smart meters for real-time data collection
   - Energy consumption monitoring
3. **Carbon Credit Trading System**
   - Real-time verification and validation
   - Prevention of fraud and double-spending
4. **Privacy & Security**
   - ZK-SNARKs for encrypted transactions
   - Data protection and access control


## How to Run the Project
1. **Install Dependencies**
   ```bash
   npm install
   ```
2. **Deploy Smart Contracts**
   ```bash
   truffle migrate --network development
   ```
3. **Run the Backend**
   ```bash
   node server.js
   ```
4. **Start the Frontend**
   ```bash
   npm start
   ```






