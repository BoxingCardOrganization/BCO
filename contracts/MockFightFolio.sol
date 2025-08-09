// contracts/MockFightfolio.sol
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

contract MockFightfolio {
    mapping(address => uint256) private fightfolioValues;

    function setFightfolioValue(address user, uint256 value) external {
        fightfolioValues[user] = value;
    }

    function getFightfolioValue(address user) external view returns (uint256) {
        return fightfolioValues[user];
    }
}

