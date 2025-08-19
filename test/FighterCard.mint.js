const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("FighterCard - mintWithSig", () => {
  it("mints with a valid backend signature", async () => {
    const [deployer, backend, user] = await ethers.getSigners();
    const FighterCard = await ethers.getContractFactory("FighterCard", deployer);
    const fc = await FighterCard.deploy(backend.address);
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

    const mint = {
      to: user.address,
      offerUsdCents: 4000,
      fighterId: 123,
      deadline: Math.floor(Date.now() / 1000) + 600,
      nonce: ethers.hexlify(ethers.randomBytes(32)),
    };

    const sig = await backend.signTypedData(domain, types, mint);

    const tx = await fc.connect(user).mintWithSig(mint, sig);
    const rcpt = await tx.wait();
    const tokenId = 1;

    expect(await fc.ownerOf(tokenId)).to.equal(user.address);
    expect(await fc.getMintPrice(tokenId)).to.equal(4000);
    expect(await fc.getCardValue(tokenId)).to.equal(4000);
  });

  it("rejects invalid signer", async () => {
    const [deployer, backend, user, attacker] = await ethers.getSigners();
    const FighterCard = await ethers.getContractFactory("FighterCard", deployer);
    const fc = await FighterCard.deploy(backend.address);
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
    const mint = {
      to: user.address,
      offerUsdCents: 4000,
      fighterId: 123,
      deadline: Math.floor(Date.now() / 1000) + 600,
      nonce: ethers.hexlify(ethers.randomBytes(32)),
    };
    const badSig = await attacker.signTypedData(domain, types, mint);

    await expect(fc.connect(user).mintWithSig(mint, badSig)).to.be.revertedWith("bad sig");
  });
});
