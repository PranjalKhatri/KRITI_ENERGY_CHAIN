// pragma solidity ^0.8.20;

// contract ClosedBid {
//     struct Bid {
//         uint256 amount;
//         uint256 price;
//         bool exists;
//         bool isProducer;
//     }

//     mapping(address => Bid) public players;
//     address[] public producers;
//     address[] public consumers;

//     event NewBid(address indexed bidder, uint256 amount, uint256 price, bool isProducer);
//     event UpdatedBid(address indexed bidder, uint256 amount, uint256 price);

//     function placeBid(uint256 _amount, uint256 _price, bool _isProducer) external {
//         if (!players[msg.sender].exists) {
//             // First-time bidder
//             players[msg.sender] = Bid(_amount, _price, true, _isProducer);

//             if (_isProducer) {
//                 producers.push(msg.sender);
//             } else {
//                 consumers.push(msg.sender);
//             }

//             emit NewBid(msg.sender, _amount, _price, _isProducer);
//         } else {
//             // Updating existing bid
//             players[msg.sender].amount = _amount;
//             players[msg.sender].price = _price;

//             emit UpdatedBid(msg.sender, _amount, _price);
//         }
//     }

//     function getProducers() external view returns (address[] memory) {
//         return producers;
//     }

//     function getConsumers() external view returns (address[] memory) {
//         return consumers;
//     }
//}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ClosedBid {
    struct Bid {
        uint256 amount;
        uint256 price;
        bool exists;
        bool isProducer;
    }

    struct Participant {
        address payable bidder;
        uint256 amount;
        uint256 price;
    }

    mapping(address => Bid) public players;
    Participant[]  public producers;
    Participant[] public consumers;

    event NewBid(address indexed bidder, uint256 amount, uint256 price, bool isProducer);
    event UpdatedBid(address indexed bidder, uint256 amount, uint256 price);

    function placeBid(uint256 _amount, uint256 _price, bool _isProducer) external {
        if (!players[msg.sender].exists) {
            // First-time bidder
            players[msg.sender] = Bid(_amount, _price, true, _isProducer);

            if (_isProducer) {
                producers.push(Participant(payable(msg.sender), _amount, _price));
            } else {
                consumers.push(Participant(payable(msg.sender), _amount, _price));
            }

            emit NewBid(msg.sender, _amount, _price, _isProducer);
        } else {
            // Updating existing bid
            players[msg.sender].amount = _amount;
            players[msg.sender].price = _price;

            if (players[msg.sender].isProducer) {
                _updateBid(producers, msg.sender, _amount, _price);
            } else {
                _updateBid(consumers, msg.sender, _amount, _price);
            }

            emit UpdatedBid(msg.sender, _amount, _price);
        }
    }

    function _updateBid(Participant[] storage list, address bidder, uint256 newAmount, uint256 newPrice) internal {
        for (uint256 i = 0; i < list.length; i++) {
            if (list[i].bidder == bidder) {
                list[i].amount = newAmount;
                list[i].price = newPrice;
                break;
            }
        }
    }

    function clearParticipants() external {
        for(uint256 i = 0; i < producers.length;i++){
            delete  players[producers[i].bidder];
        }
        for(uint256 i = 0; i < consumers.length;i++){
            delete  players[consumers[i].bidder];
        }
        delete producers; 
        delete consumers; 
        // delete players;
    }

    function getProducers() external view returns (Participant[] memory) {
        return producers;
    }

    function getConsumers() external view returns (Participant[] memory) {
        return consumers;
    }
}
