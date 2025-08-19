// test/fightercard.test.js
const { expect } = require("chai");
const { ethers } = require("hardhat");

const NAME = "BCO-FighterCard";
const VERSION = "1";

describe("FighterCard (MVP)", function () {
  async function deployFixture() {
    const [deployer, backend, user, other] = await ethers.getSigners();
    const FighterCard = await ethers.getContractFactory("FighterCard", deployer);
    const fc = await FighterCard.deploy(backend.address);
    await fc.waitForDeployment();

    const chainId = (await ethers.provider.getNetwork()).chainId;
    const domain = {
      name: NAME,
      version: VERSION,
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

    return { fc, deployer, backend, user, other, domain, types };
  }

  function mintPayload(to, offerUsdCents = 4000, fighterId = 123) {
    return {
      to,
      offerUsdCents,
      fighterId,
      deadline: Math.floor(Date.now() / 1000) + 600,
      nonce: ethers.hexlify(ethers.randomBytes(32)),
    };
  }

  it("mints with a valid backend signature and stores values", async () => {
    const { fc, backend, user, domain, types } = await deployFixture();

    const mint = mintPayload(user.address, 4000, 555);
    const sig = await backend.signTypedData(domain, types, mint);

    const tx = await fc.connect(user).mintWithSig(mint, sig);
    await tx.wait();

    const tokenId = 1;
    expect(await fc.ownerOf(tokenId)).to.equal(user.address);
    expect(await fc.getMintPrice(tokenId)).to.equal(4000);
    expect(await fc.getCardValue(tokenId)).to.equal(4000);
    expect(await fc.fighterIdOf(tokenId)).to.equal(555);
    expect(await fc.isRedeemed(tokenId)).to.equal(false);
  });

  it("rejects invalid signer", async () => {
    const { fc, user, other, domain, types } = await deployFixture();

    const mint = mintPayload(user.address);
    const badSig = await other.signTypedData(domain, types, mint);

    await expect(fc.connect(user).mintWithSig(mint, badSig)).to.be.revertedWith("bad sig");
  });

  it("rejects expired mints and reused nonces", async () => {
    const { fc, backend, user, domain, types } = await deployFixture();

    // expired
    const expired = {
      ...mintPayload(user.address),
      deadline: Math.floor(Date.now() / 1000) - 1,
    };
    const expiredSig = await backend.signTypedData(domain, types, expired);
    await expect(fc.connect(user).mintWithSig(expired, expiredSig)).to.be.revertedWith("expired");

    // reuse nonce
    const fresh = mintPayload(user.address);
    const sig = await backend.signTypedData(domain, types, fresh);
    await fc.connect(user).mintWithSig(fresh, sig);
    await expect(fc.connect(user).mintWithSig(fresh, sig)).to.be.revertedWith("nonce used");
  });

  it("owner can set card value and redemption flag; non-owner cannot", async () => {
    const { fc, backend, user, domain, types, deployer } = await deployFixture();

    // mint first
    const mint = mintPayload(user.address, 4000, 777);
    const sig = await backend.signTypedData(domain, types, mint);
    await fc.connect(user).mintWithSig(mint, sig);

    const tokenId = 1;

    // non-owner cannot set value
    await expect(fc.connect(user).setCardValue(tokenId, 4500))
      .to.be.revertedWithCustomError(fc, "OwnableUnauthorizedAccount")
      .withArgs(user.address);

    // non-owner cannot set redeemed
    await expect(fc.connect(user).setRedeemed(tokenId, true))
      .to.be.revertedWithCustomError(fc, "OwnableUnauthorizedAccount")
      .withArgs(user.address);

    // owner updates value + redeem flag
    await fc.connect(deployer).setCardValue(tokenId, 4500);
    expect(await fc.getCardValue(tokenId)).to.equal(4500);

    await fc.connect(deployer).setRedeemed(tokenId, true);
    expect(await fc.isRedeemed(tokenId)).to.equal(true);
  });

  it("owner can update signer; new signer works", async () => {
    const { fc, backend, user, domain, types, deployer, other } = await deployFixture();

    // switch signer
    await fc.connect(deployer).setSigner(other.address);

    // mint with old backend should fail
    const attemptOld = mintPayload(user.address);
    const oldSig = await backend.signTypedData(domain, types, attemptOld);
    await expect(fc.connect(user).mintWithSig(attemptOld, oldSig)).to.be.revertedWith("bad sig");

    // mint with new signer succeeds
    const mint = mintPayload(user.address, 5000, 999);
    const newSig = await other.signTypedData(domain, types, mint);
    await fc.connect(user).mintWithSig(mint, newSig);

    expect(await fc.ownerOf(1)).to.equal(user.address);
    expect(await fc.getMintPrice(1)).to.equal(5000);
    expect(await fc.fighterIdOf(1)).to.equal(999);
  });
});
