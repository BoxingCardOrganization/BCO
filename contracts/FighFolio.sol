// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

interface IFighterCard {
    function ownerOf(uint256 tokenId) external view returns (address);
    function getMintPrice(uint256 tokenId) external view returns (uint256);
    function getCardValue(uint256 tokenId) external view returns (uint256);
}

contract Fightfolio {
    address public admin;
    IFighterCard public fighterCard;

    // Track if a card has been redeemed
    mapping(uint256 => bool) public isRedeemed;

    // Track cards owned by each user
    mapping(address => uint256[]) private userCards;

    constructor(address _fighterCardAddress) {
        fighterCard = IFighterCard(_fighterCardAddress);
        admin = msg.sender;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Not authorized");
        _;
    }

    // Called when a card is minted or bought (including resales)
    function recordCardPurchase(address user, uint256 tokenId) external onlyAdmin {
        userCards[user].push(tokenId);
    }

    // Called when a card is redeemed
    function markCardRedeemed(uint256 tokenId) external onlyAdmin {
        isRedeemed[tokenId] = true;
    }

    // Get cards a user owns
    function getOwnedCards(address user) external view returns (uint256[] memory) {
        return userCards[user];
    }

    // Weekly Fightfolio valuation using CURRENT card values
    function getFightfolioValue(address user) external view returns (uint256 totalValue) {
        uint256[] memory cards = userCards[user];
        for (uint256 i = 0; i < cards.length; i++) {
            uint256 cardId = cards[i];
            if (!isRedeemed[cardId] && fighterCard.ownerOf(cardId) == user) {
                totalValue += fighterCard.getCardValue(cardId); // Use current weekly value
            }
        }
    }

    // Admin fallback to update FighterCard address
    function updateFighterCard(address _newAddress) external onlyAdmin {
        fighterCard = IFighterCard(_newAddress);
    }
}
