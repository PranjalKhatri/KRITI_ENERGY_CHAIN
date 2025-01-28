import Web3 from 'web3';
import dotenv from 'dotenv';

// Initialize dotenv
dotenv.config();
console.log(process.env.API_URL);
// Contract ABI
const CONTRACT_ABI = [
    {
        "inputs": [{"internalType": "string","name": "initMessage","type": "string"}],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "anonymous": false,
        "inputs": [
            {"indexed": false,"internalType": "string","name": "oldStr","type": "string"},
            {"indexed": false,"internalType": "string","name": "newStr","type": "string"}
        ],
        "name": "UpdatedMessages",
        "type": "event"
    },
    {
        "inputs": [],
        "name": "message",
        "outputs": [{"internalType": "string","name": "","type": "string"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "string","name": "newMessage","type": "string"}],
        "name": "update",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
];

// Contract address
const CONTRACT_ADDRESS = '0xA9c09E9566aA5369bAf231e3fdfAFD9940A1E6Ca';

// Initialize Web3 and contract
const initializeContract = () => {
    try {
        // Verify environment variable exists
        const API_URL = process.env.NEXT_PUBLIC_API_URL;
        if (!API_URL) {
            console.error("API url not found");
            throw new Error('API_URL not found in environment variables');
        }

        // Initialize Web3 with provider
        const provider = new Web3.providers.HttpProvider(API_URL);
        const web3 = new Web3(provider);

        // Create and verify contract instance
        const contract = new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);
        
        // Verify contract exists
        if (!contract) {
            throw new Error('Failed to initialize contract');
        }

        console.log("Contract initialized successfully");
        return contract;

    } catch (error) {
        console.error('Error initializing contract:', error);
        throw error;
    }
};

// Initialize contract
const vmContract = initializeContract();

// Export contract instance
export default vmContract;

// Export helper functions for common contract interactions
export const getContractMessage = async () => {
    try {
        const message = await vmContract.methods.message().call();
        return message;
    } catch (error) {
        console.error('Error getting message:', error);
        throw error;
    }
};

export const updateMessage = async (newMessage, fromAddress) => {
    try {
        return await vmContract.methods.update(newMessage).send({ from: fromAddress });
    } catch (error) {
        console.error('Error updating message:', error);
        throw error;
    }
};