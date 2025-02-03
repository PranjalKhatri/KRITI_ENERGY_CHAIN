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

    // **Storage for tracking transactions**
    struct Transaction {
        address producer;
        address consumer;
        uint256 amount;
        uint256 price;
    }

    Transaction[] public successfulTransactions; // Stores all successful transactions
    mapping(address => uint256) public dsoFunctionCalls; // Tracks how many times each address called DSO functions

    constructor(address _closedBidAddress, address payable _DSO) {
        closedBidContract = IClosedBid(_closedBidAddress);
        DSO = _DSO;
    }

    function depositFunds() external payable {
        require(msg.value > 0, "Deposit amount must be greater than zero");
        balances[msg.sender] += msg.value;
    }

    function sellEnergyToDSO(uint256 amount) external payable {
        require(amount > 0, "Amount must be greater than zero");
        
        uint256 totalCost = amount * p_buy * 1 ether;
        require(DSOETHBalance >= totalCost, "DSO has insufficient ETH");

        clearedEnergy[msg.sender] += amount;
        balances[msg.sender] += totalCost;
        DSOETHBalance -= totalCost;
        DSOEnergy += amount;

        // Track function call
        dsoFunctionCalls[msg.sender]++;

        // Store transaction record
        successfulTransactions.push(Transaction(msg.sender, address(DSO), amount, p_buy));
    }

    function buyEnergyFromDSO(uint256 amount) external payable {
        require(amount > 0, "Amount must be greater than zero");
        
        uint256 totalCost = amount * p_sell * 1 ether;
        require(balances[msg.sender] >= totalCost, "Consumer has insufficient funds for DSO purchase");
        require(DSOEnergy >= amount, "DSO has insufficient energy");

        clearedEnergy[msg.sender] += amount;
        balances[msg.sender] -= totalCost;
        DSOETHBalance += totalCost;
        DSOEnergy -= amount;

        // Track function call
        dsoFunctionCalls[msg.sender]++;

        // Store transaction record
        successfulTransactions.push(Transaction(address(DSO), msg.sender, amount, p_sell));
    }

    function executeEnergyExchange() external payable {
        IClosedBid.Participant[] memory producers = closedBidContract.getProducers();
        IClosedBid.Participant[] memory consumers = closedBidContract.getConsumers();

        _sortAscending(producers);
        _sortDescending(consumers);

        uint256 i = 0;
        uint256 j = 0;

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

                // Store successful transaction
                successfulTransactions.push(Transaction(producer, consumer, clearAmount, clearPrice));

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

    // **Getter Functions**
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

    function getTransactionCount() external view returns (uint256) {
        return successfulTransactions.length;
    }

    function getTransactionDetails(uint256 index) external view returns (address, address, uint256, uint256) {
        require(index < successfulTransactions.length, "Invalid index");
        Transaction storage txn = successfulTransactions[index];
        return (txn.producer, txn.consumer, txn.amount, txn.price);
    }

    function getDSOFunctionCalls(address user) external view returns (uint256) {
        return dsoFunctionCalls[user];
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