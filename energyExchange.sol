// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IClosedBid {
    struct Participant {
        address payable bidder;
        uint256 amount;
        uint256 price;
    }

    function getProducers() external view returns (Participant[] memory);
    function getConsumers() external view returns (Participant[] memory);
}

contract EnergyExchange {
    IClosedBid public closedBidContract;
    
    mapping(address => uint256) public clearedEnergy;
    mapping(address => uint256) public balances;

    address payable public DSO;
    uint256 public DSOEnergy = 100000;
    uint256 public DSOETHBalance = 100000 ether;

    uint256 public p_buy = 2;
    uint256 public p_sell = 8;

    event EnergyCleared(address indexed producer, address indexed consumer, uint256 amount, uint256 price);
    event PaymentProcessed(address indexed payer, address indexed receiver, uint256 amount, uint256 totalCost);
    event DSOTransaction(address indexed entity, uint256 amount, uint256 price, bool isSelling);

    constructor(address _closedBidAddress, address payable _DSO) {
        closedBidContract = IClosedBid(_closedBidAddress);
        DSO = _DSO;
    }

    function depositFunds() external payable {
        require(msg.value > 0, "Deposit amount must be greater than zero");
        balances[msg.sender] += msg.value;
    }

    // Separated function for producers to sell energy to DSO
    function sellEnergyToDSO(uint256 amount) external payable {
        require(amount > 0, "Amount must be greater than zero");
        
        uint256 totalCost = amount * p_buy * 1 ether; // Calculate payment in Wei
        require(DSOETHBalance >= totalCost, "DSO has insufficient ETH");

        // Update states
        clearedEnergy[msg.sender] += amount;
        balances[msg.sender] += totalCost;
        DSOETHBalance -= totalCost;
        DSOEnergy += amount;

        emit DSOTransaction(msg.sender, amount, p_buy, false);
    }

    // Separated function for consumers to buy energy from DSO
    function buyEnergyFromDSO(uint256 amount) external payable  {
        require(amount > 0, "Amount must be greater than zero");
        
        uint256 totalCost = amount * p_sell * 1 ether; // Calculate payment in Wei
        require(balances[msg.sender] >= totalCost, "Consumer has insufficient funds for DSO purchase");
        require(DSOEnergy >= amount, "DSO has insufficient energy");

        // Update states
        clearedEnergy[msg.sender] += amount;
        balances[msg.sender] -= totalCost;
        DSOETHBalance += totalCost;
        DSOEnergy -= amount;

        emit DSOTransaction(msg.sender, amount, p_sell, true);
    }

    function executeEnergyExchange() external payable {
        IClosedBid.Participant[] memory producers = closedBidContract.getProducers();
        IClosedBid.Participant[] memory consumers = closedBidContract.getConsumers();

        _sortAscending(producers);
        _sortDescending(consumers);

        uint256 i = 0;
        uint256 j = 0;

        // P2P Matching
        while (i < producers.length && j < consumers.length) {
            address payable producer = producers[i].bidder;
            address payable consumer = consumers[j].bidder;

            uint256 producerAmount = producers[i].amount;
            uint256 producerPrice = producers[i].price;

            uint256 consumerAmount = consumers[j].amount;
            uint256 consumerPrice = consumers[j].price;

            if (producerPrice <= consumerPrice) {
                uint256 clearAmount = _min(producerAmount, consumerAmount);
                uint256 clearPrice = (producerPrice + consumerPrice) / 2;
                uint256 totalCost = clearAmount * clearPrice * 1 ether;

                require(balances[consumer] >= totalCost, "Consumer has insufficient funds");

                clearedEnergy[producer] += clearAmount;
                clearedEnergy[consumer] += clearAmount;

                balances[consumer] -= totalCost;
                balances[producer] += totalCost;

                emit EnergyCleared(producer, consumer, clearAmount, clearPrice);
                emit PaymentProcessed(consumer, producer, clearAmount, totalCost);

                producers[i].amount -= clearAmount;
                consumers[j].amount -= clearAmount;

                i++;
                j++;
            } else {
                i++;
                j++;
            }
        }
    }

    function withdrawFunds() external {
        uint256 balance = balances[msg.sender];
        require(balance > 0, "No funds to withdraw");
        balances[msg.sender] = 0;
        payable(msg.sender).transfer(balance);
    }

    function getClearedEnergy(address bidder) external view returns (uint256) {
        return clearedEnergy[bidder];
    }

    function getBalance(address user) external view returns (uint256) {
        return balances[user];
    }

    function getDSOEnergy() external view returns (uint256) {
        return DSOEnergy;
    }

    function getDSOETHBalance() external view returns (uint256) {
        return DSOETHBalance;
    }

    function _sortAscending(IClosedBid.Participant[] memory arr) internal pure {
        uint256 n = arr.length;
        for (uint256 i = 0; i < n; i++) {
            for (uint256 j = i + 1; j < n; j++) {
                if (arr[i].price > arr[j].price) {
                    (arr[i], arr[j]) = (arr[j], arr[i]);
                }
            }
        }
    }

    function _sortDescending(IClosedBid.Participant[] memory arr) internal pure {
        uint256 n = arr.length;
        for (uint256 i = 0; i < n; i++) {
            for (uint256 j = i + 1; j < n; j++) {
                if (arr[i].price < arr[j].price) {
                    (arr[i], arr[j]) = (arr[j], arr[i]);
                }
            }
        }
    }

    function _min(uint256 a, uint256 b) internal pure returns (uint256) {
        return (a < b) ? a : b;
    }
}
