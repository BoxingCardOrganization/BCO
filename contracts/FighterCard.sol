// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract FighterCard is ERC721URIStorage, ERC721Enumerable, Ownable {
    uint256 private _tokenIdCounter;

    // Store the mint price for each card
    mapping(uint256 => uint256) public mintPrices;

    constructor(address initialOwner) ERC721("FighterCard", "FTR") Ownable(initialOwner) {}

    function mintCard(address to, string memory tokenURI, uint256 price) public onlyOwner {
        _tokenIdCounter += 1;
        uint256 tokenId = _tokenIdCounter;

        _mint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);
        mintPrices[tokenId] = price;
    }

    function getMintPrice(uint256 tokenId) external view returns (uint256) {
        return mintPrices[tokenId];
    }

    function totalMinted() public view returns (uint256) {
        return _tokenIdCounter;
    }

    // Required overrides for ERC721 + ERC721Enumerable
    function _beforeTokenTransfer(address from, address to, uint256 tokenId, uint256 batchSize)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
