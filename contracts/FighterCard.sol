// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * BCO FighterCard (MVP)
 * - Signature-gated mint (EIP-712)
 * - Stores offer amount (USD cents) at mint
 * - Exposes getMintPrice() and getCardValue() for Fightfolio reads
 * - Optional Fightfolio hook called on every transfer/mint/burn
 * - Per-fighter max supply cap (optional: 0 = unlimited)
 * - No Enumerable (keeps inheritance simple & avoids override errors)
 */

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

interface IFightfolioHook {
    function onTransfer(address from, address to, uint256 tokenId) external;
}

contract FighterCard is ERC721, Ownable, EIP712 {
    using ECDSA for bytes32;

    // -------- Storage --------
    uint256 private _nextId = 1;
    address public signer;                  // backend signer authorizing paid mints
    IFightfolioHook public fightfolioHook;  // optional on-chain indexer/hook

    // Pricing / values (USD cents)
    mapping(uint256 => uint256) private _mintPriceUsdCents;    // tokenId => price paid at mint
    mapping(uint256 => uint256) private _currentValueUsdCents; // tokenId => current valuation (admin/engine set)

    // Business metadata
    mapping(uint256 => uint256) public fighterIdOf; // tokenId => fighterId
    mapping(uint256 => bool)    public isRedeemed;  // tokenId => redeemed flag

    // Per-fighter supply controls
    mapping(uint256 => uint256) public maxSupplyByFighter; // fighterId => max supply (0 = unlimited)
    mapping(uint256 => uint256) public mintedByFighter;    // fighterId => minted count
    mapping(uint256 => uint256) public attendanceRecord;   // fighterId => highest headlined attendance

    // Sig replay protection
    mapping(bytes32 => bool) public usedNonce;

    // -------- EIP-712 types --------
    struct MintAuth {
        address to;            // recipient wallet (smart account)
        uint256 offerUsdCents; // e.g., 4000 = $40.00
        uint256 fighterId;     // which fighter this card refers to
        uint256 deadline;      // unix seconds
        bytes32 nonce;         // unique per mint
    }

    bytes32 private constant MINT_TYPEHASH =
        keccak256("MintAuth(address to,uint256 offerUsdCents,uint256 fighterId,uint256 deadline,bytes32 nonce)");

    // -------- Events --------
    event Minted(address indexed to, uint256 indexed tokenId, uint256 indexed fighterId, uint256 offerUsdCents);
    event Redeemed(uint256 indexed tokenId);
    event CardValueUpdated(uint256 indexed tokenId, uint256 newValueUsdCents);
    event SignerUpdated(address indexed newSigner);
    event FightfolioHookSet(address indexed hook);
    event MaxSupplySet(uint256 indexed fighterId, uint256 maxSupply);
    event AttendanceRecorded(uint256 indexed fighterId, uint256 attendance);
    event CapCalculated(uint256 indexed fighterId, uint256 attendance, uint256 calculatedCap);

    // -------- Constructor --------
    constructor(address initialSigner)
        ERC721("BCO Fighter Card", "BCOFC")
        EIP712("BCO-FighterCard", "1")
        Ownable(msg.sender)
    {
        signer = initialSigner;
        emit SignerUpdated(initialSigner);
    }

    // -------- Admin --------
    function setSigner(address s) external onlyOwner {
        require(s != address(0), "bad signer");
        signer = s;
        emit SignerUpdated(s);
    }

    function setFightfolioHook(address hook) external onlyOwner {
        fightfolioHook = IFightfolioHook(hook);
        emit FightfolioHookSet(hook);
    }

    /// Record attendance and calculate supply cap (50% of highest attendance)
    function recordAttendance(uint256 fighterId, uint256 attendance) external onlyOwner {
        require(attendance > 0, "attendance must be positive");
        
        // Only allow attendance increases (can't reduce historical max)
        require(attendance >= attendanceRecord[fighterId], "attendance cannot decrease");
        
        attendanceRecord[fighterId] = attendance;
        emit AttendanceRecorded(fighterId, attendance);
        
        // Calculate new cap: 50% of attendance, rounded down
        uint256 newCap = attendance / 2;
        
        // Cap can only increase, never decrease
        if (newCap > maxSupplyByFighter[fighterId]) {
            maxSupplyByFighter[fighterId] = newCap;
            emit MaxSupplySet(fighterId, newCap);
        }
        
        emit CapCalculated(fighterId, attendance, newCap);
    }

    /// Manual cap override (only to increase, for special cases)
    function increaseMaxSupply(uint256 fighterId, uint256 newMaxSupply) external onlyOwner {
        require(newMaxSupply > maxSupplyByFighter[fighterId], "can only increase cap");
        require(newMaxSupply >= mintedByFighter[fighterId], "below minted");
        maxSupplyByFighter[fighterId] = newMaxSupply;
        emit MaxSupplySet(fighterId, newMaxSupply);
    }

    /// Get fighter attendance record
    function getAttendanceRecord(uint256 fighterId) external view returns (uint256) {
        return attendanceRecord[fighterId];
    }

    /// Update current valuation in USD cents (from your pricing engine/oracle/admin)
    function setCardValue(uint256 tokenId, uint256 newValueUsdCents) external onlyOwner {
        require(_exists(tokenId), "no token");
        _currentValueUsdCents[tokenId] = newValueUsdCents;
        emit CardValueUpdated(tokenId, newValueUsdCents);
    }

    /// Mark a token redeemed (tickets issued). You can gate this to an authorized role later.
    function setRedeemed(uint256 tokenId, bool redeemed) external onlyOwner {
        require(_exists(tokenId), "no token");
        isRedeemed[tokenId] = redeemed;
        if (redeemed) emit Redeemed(tokenId);
    }

    // -------- Mint (signature-gated) --------
    function mintWithSig(MintAuth calldata m, bytes calldata sig) external returns (uint256 tokenId) {
        require(block.timestamp <= m.deadline, "expired");
        require(m.to != address(0), "bad to");
        require(!usedNonce[m.nonce], "nonce used");

        // EIP-712 digest
        bytes32 digest = _hashTypedDataV4(
            keccak256(abi.encode(MINT_TYPEHASH, m.to, m.offerUsdCents, m.fighterId, m.deadline, m.nonce))
        );
        address recovered = ECDSA.recover(digest, sig);
        require(recovered == signer, "bad sig");

        // Enforce per-fighter max supply (0 = unlimited)
        uint256 fid = m.fighterId;
        uint256 newMinted = mintedByFighter[fid] + 1;
        uint256 maxS = maxSupplyByFighter[fid];
        require(maxS == 0 || newMinted <= maxS, "sold out");
        mintedByFighter[fid] = newMinted;

        usedNonce[m.nonce] = true;

        tokenId = _nextId++;
        _safeMint(m.to, tokenId);

        // Record economics/metadata
        _mintPriceUsdCents[tokenId]    = m.offerUsdCents;
        _currentValueUsdCents[tokenId] = m.offerUsdCents; // initialize current value to offer; update off-chain later
        fighterIdOf[tokenId]           = m.fighterId;

        emit Minted(m.to, tokenId, m.fighterId, m.offerUsdCents);
    }

    // -------- Public views (Fightfolio expects these) --------
    /// Price paid at mint time (USD cents)
    function getMintPrice(uint256 tokenId) external view returns (uint256) {
        return _mintPriceUsdCents[tokenId];
    }

    /// Current valuation (USD cents) – settable by admin/engine
    function getCardValue(uint256 tokenId) external view returns (uint256) {
        return _currentValueUsdCents[tokenId];
    }

    // -------- Internal hook to notify Fightfolio on ownership changes --------
    // OZ 5.x _update is called for mint, transfer, and burn. We forward to our hook if set.
    function _update(address to, uint256 tokenId, address auth)
        internal
        override
        returns (address from)
    {
        from = super._update(to, tokenId, auth);
        if (address(fightfolioHook) != address(0)) {
            // try/catch so a broken hook can't block transfers
            try fightfolioHook.onTransfer(from, to, tokenId) {} catch {}
        }
    }

    // -------- Utilities --------
    function _exists(uint256 tokenId) internal view returns (bool) {
        // ownerOf reverts for nonexistent; wrap in try-catch for a boolean exists check
        try this.ownerOf(tokenId) returns (address) {
            return true;
        } catch {
            return false;
        }
    }
}

