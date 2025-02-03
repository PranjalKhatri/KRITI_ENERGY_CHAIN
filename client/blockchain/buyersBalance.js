import Web3 from "web3";
import dotenv from "dotenv";

// Initialize dotenv
dotenv.config();
console.log(process.env.API_URL);

const CONTRACT_ABI = [
	{
		"inputs": [
			{
				"components": [
					{
						"components": [
							{
								"internalType": "uint256",
								"name": "X",
								"type": "uint256"
							},
							{
								"internalType": "uint256",
								"name": "Y",
								"type": "uint256"
							}
						],
						"internalType": "struct Pairing.G1Point",
						"name": "a",
						"type": "tuple"
					},
					{
						"components": [
							{
								"internalType": "uint256[2]",
								"name": "X",
								"type": "uint256[2]"
							},
							{
								"internalType": "uint256[2]",
								"name": "Y",
								"type": "uint256[2]"
							}
						],
						"internalType": "struct Pairing.G2Point",
						"name": "b",
						"type": "tuple"
					},
					{
						"components": [
							{
								"internalType": "uint256",
								"name": "X",
								"type": "uint256"
							},
							{
								"internalType": "uint256",
								"name": "Y",
								"type": "uint256"
							}
						],
						"internalType": "struct Pairing.G1Point",
						"name": "c",
						"type": "tuple"
					}
				],
				"internalType": "struct Verifier.Proof",
				"name": "proof",
				"type": "tuple"
			},
			{
				"internalType": "uint256[3]",
				"name": "input",
				"type": "uint256[3]"
			}
		],
		"name": "verifyTx",
		"outputs": [
			{
				"internalType": "bool",
				"name": "r",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
]
const CONTRACT_ADDRESS = "0x77133d22D357E2F58af2668Bee8a7c28651A6967";

// Initialize Web3 and contract
const initializeContract = () => {
  try {
    // Verify environment variable exists
    const API_URL = process.env.NEXT_PUBLIC_API_URL;
    if (!API_URL) {
      console.error("API url not found");
      throw new Error("API_URL not found in environment variables");
    }

    // Initialize Web3 with provider
    const provider = new Web3.providers.HttpProvider(API_URL);
    const web3 = new Web3(provider);

    // Create and verify contract instance
    const contract = new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);

    // Verify contract exists
    if (!contract) {
      throw new Error("Failed to initialize contract");
    }

    console.log("Contract initialized successfully");
    return contract;
  } catch (error) {
    console.error("Error initializing contract:", error);
    throw error;
  }
};

// Initialize contract
const vmContract = initializeContract();

// Export contract instance
export default vmContract;