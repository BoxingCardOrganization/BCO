// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IFightfolio {
    function getFightfolioValue(address user) external view returns (uint256);
}

contract FanTier {
    IFightfolio public fightfolio;
    address public owner;

    constructor(address _fightfolio) {
        fightfolio = IFightfolio(_fightfolio);
        owner = msg.sender;
    }

    function getFanTier(address user) public view returns (uint8) {
        uint256 value = fightfolio.getFightfolioValue(user);

        if (value >= 1000) return 3; // Purist
        if (value >= 500) return 2;  // Historian
        if (value >= 100) return 1;  // Analyst
        return 0;                    // Casual
    }

    function updateFightfolio(address _newAddress) external {
        require(msg.sender == owner, "Only owner can update");
        fightfolio = IFightfolio(_newAddress);
    }
}


