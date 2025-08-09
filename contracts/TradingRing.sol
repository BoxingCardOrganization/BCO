// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./FanTier.sol";

contract TradingRing {
    struct Message {
        address sender;
        string content;
        uint8 fanTier;
        uint256 timestamp;
    }

    FanTier public fanTier;
    address public owner;
    Message[] public messages;

    event MessagePosted(address indexed sender, string content, uint8 fanTier, uint256 timestamp);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(address _fanTierAddress, address _owner) {
        fanTier = FanTier(_fanTierAddress);
        owner = _owner;
    }

    function postMessage(string calldata content) external {
    uint8 tier = uint8(fanTier.getFanTier(msg.sender));
        Message memory newMessage = Message(msg.sender, content, tier, block.timestamp);
        messages.push(newMessage);

        emit MessagePosted(msg.sender, content, tier, block.timestamp);
    }

    function getMessages() external view returns (Message[] memory) {
        return messages;
    }
}
