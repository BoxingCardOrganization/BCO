
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("FighterCard Supply Management", function () {
  let fc, deployer, backend, user;

  async function deployFixture() {
    [deployer, backend, user] = await ethers.getSigners();
    const FighterCard = await ethers.getContractFactory("FighterCard");
    fc = await FighterCard.deploy(backend.address);
    await fc.waitForDeployment();

    const chainId = (await ethers.provider.getNetwork()).chainId;
    const domain = {
      name: "BCO-FighterCard",
      version: "1", 
      chainId,
      verifyingContract: await fc.getAddress(),
    };

    const types = {
      MintAuth: [
        { name: "to", type: "address" },
        { name: "offerUsdCents", type: "uint256" },
        { name: "fighterId", type: "uint256" },
        { name: "deadline", type: "uint256" },
        { name: "nonce", type: "bytes32" },
      ],
    };

    return { fc, deployer, backend, user, domain, types };
  }

  function mintPayload(to, fighterId = 123, offerUsdCents = 4000) {
    return {
      to,
      offerUsdCents,
      fighterId,
      deadline: Math.floor(Date.now() / 1000) + 600,
      nonce: ethers.hexlify(ethers.randomBytes(32)),
    };
  }

  beforeEach(async function () {
    ({ fc, deployer, backend, user, domain, types } = await deployFixture());
  });

  describe("Attendance Recording", function () {
    it("should record attendance and calculate cap correctly", async function () {
      const fighterId = 555;
      const attendance = 10000;
      const expectedCap = Math.floor(attendance / 2); // 5000

      await expect(fc.connect(deployer).recordAttendance(fighterId, attendance))
        .to.emit(fc, "AttendanceRecorded")
        .withArgs(fighterId, attendance)
        .and.to.emit(fc, "MaxSupplySet")
        .withArgs(fighterId, expectedCap);

      expect(await fc.getAttendanceRecord(fighterId)).to.equal(attendance);
      expect(await fc.maxSupplyByFighter(fighterId)).to.equal(expectedCap);
    });

    it("should only allow attendance increases", async function () {
      const fighterId = 555;
      
      // Set initial attendance
      await fc.connect(deployer).recordAttendance(fighterId, 10000);
      
      // Try to decrease - should fail
      await expect(
        fc.connect(deployer).recordAttendance(fighterId, 5000)
      ).to.be.revertedWith("attendance cannot decrease");
      
      // Increase should work
      await fc.connect(deployer).recordAttendance(fighterId, 15000);
      expect(await fc.getAttendanceRecord(fighterId)).to.equal(15000);
      expect(await fc.maxSupplyByFighter(fighterId)).to.equal(7500);
    });

    it("should not decrease caps when attendance stays same", async function () {
      const fighterId = 555;
      
      // Set initial attendance of 10000 (cap = 5000)
      await fc.connect(deployer).recordAttendance(fighterId, 10000);
      
      // Manually increase cap
      await fc.connect(deployer).increaseMaxSupply(fighterId, 6000);
      
      // Record same attendance - cap should not decrease
      await fc.connect(deployer).recordAttendance(fighterId, 10000);
      expect(await fc.maxSupplyByFighter(fighterId)).to.equal(6000);
    });

    it("should reject zero attendance", async function () {
      await expect(
        fc.connect(deployer).recordAttendance(555, 0)
      ).to.be.revertedWith("attendance must be positive");
    });

    it("should only allow owner to record attendance", async function () {
      await expect(
        fc.connect(user).recordAttendance(555, 10000)
      ).to.be.revertedWithCustomError(fc, "OwnableUnauthorizedAccount");
    });
  });

  describe("Manual Cap Increases", function () {
    it("should allow manual cap increases", async function () {
      const fighterId = 555;
      
      // Set initial cap via attendance
      await fc.connect(deployer).recordAttendance(fighterId, 10000); // cap = 5000
      
      // Increase manually
      await expect(fc.connect(deployer).increaseMaxSupply(fighterId, 6000))
        .to.emit(fc, "MaxSupplySet")
        .withArgs(fighterId, 6000);
        
      expect(await fc.maxSupplyByFighter(fighterId)).to.equal(6000);
    });

    it("should not allow cap decreases", async function () {
      const fighterId = 555;
      
      await fc.connect(deployer).recordAttendance(fighterId, 10000); // cap = 5000
      
      await expect(
        fc.connect(deployer).increaseMaxSupply(fighterId, 4000)
      ).to.be.revertedWith("can only increase cap");
    });

    it("should not allow setting cap below minted count", async function () {
      const fighterId = 555;
      
      // Set cap and mint some tokens
      await fc.connect(deployer).recordAttendance(fighterId, 10000); // cap = 5000
      
      // Mint a token
      const mint = mintPayload(user.address, fighterId);
      const sig = await backend.signTypedData(domain, types, mint);
      await fc.connect(user).mintWithSig(mint, sig);
      
      // Try to set cap below minted count
      await expect(
        fc.connect(deployer).increaseMaxSupply(fighterId, 0)
      ).to.be.revertedWith("can only increase cap");
    });
  });

  describe("Supply Enforcement", function () {
    it("should enforce supply cap during minting", async function () {
      const fighterId = 555;
      
      // Set very low cap
      await fc.connect(deployer).recordAttendance(fighterId, 2); // cap = 1
      
      // First mint should work
      const mint1 = mintPayload(user.address, fighterId);
      const sig1 = await backend.signTypedData(domain, types, mint1);
      await fc.connect(user).mintWithSig(mint1, sig1);
      
      // Second mint should fail
      const mint2 = mintPayload(user.address, fighterId);
      const sig2 = await backend.signTypedData(domain, types, mint2);
      await expect(
        fc.connect(user).mintWithSig(mint2, sig2)
      ).to.be.revertedWith("sold out");
    });

    it("should allow unlimited minting when cap is 0", async function () {
      const fighterId = 555;
      // Don't set any cap (defaults to 0 = unlimited)
      
      // Should be able to mint
      const mint = mintPayload(user.address, fighterId);
      const sig = await backend.signTypedData(domain, types, mint);
      await fc.connect(user).mintWithSig(mint, sig);
      
      expect(await fc.mintedByFighter(fighterId)).to.equal(1);
    });

    it("should track minted count correctly", async function () {
      const fighterId = 555;
      
      await fc.connect(deployer).recordAttendance(fighterId, 10000); // cap = 5000
      
      expect(await fc.mintedByFighter(fighterId)).to.equal(0);
      
      // Mint first token
      const mint1 = mintPayload(user.address, fighterId);
      const sig1 = await backend.signTypedData(domain, types, mint1);
      await fc.connect(user).mintWithSig(mint1, sig1);
      
      expect(await fc.mintedByFighter(fighterId)).to.equal(1);
      
      // Mint second token
      const mint2 = mintPayload(user.address, fighterId);
      const sig2 = await backend.signTypedData(domain, types, mint2);
      await fc.connect(user).mintWithSig(mint2, sig2);
      
      expect(await fc.mintedByFighter(fighterId)).to.equal(2);
    });
  });

  describe("Integration with Existing Mint Flow", function () {
    it("should work with existing mint signature flow", async function () {
      const fighterId = 555;
      const attendance = 10000;
      
      // Set cap
      await fc.connect(deployer).recordAttendance(fighterId, attendance);
      
      // Mint with signature
      const mint = mintPayload(user.address, fighterId, 4000);
      const sig = await backend.signTypedData(domain, types, mint);
      
      await expect(fc.connect(user).mintWithSig(mint, sig))
        .to.emit(fc, "Minted")
        .withArgs(user.address, 1, fighterId, 4000);
        
      expect(await fc.ownerOf(1)).to.equal(user.address);
      expect(await fc.fighterIdOf(1)).to.equal(fighterId);
      expect(await fc.mintedByFighter(fighterId)).to.equal(1);
    });
  });
});
