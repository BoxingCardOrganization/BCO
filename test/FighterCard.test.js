const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("FighterCard Contract", function () {
  let FighterCard, fighterCard, owner, addr1;

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();
    FighterCard = await ethers.getContractFactory("FighterCard");
    fighterCard = await FighterCard.deploy(owner.address);
  });

  it("Should deploy and set the right owner", async function () {
    expect(await fighterCard.owner()).to.equal(owner.address);
  });

  it("Should mint a FighterCard and assign it to addr1", async function () {
    const tokenURI = "https://example.com/metadata.json";
    const tx = await fighterCard.mintCard(addr1.address, tokenURI);
    await tx.wait();

    expect(await fighterCard.ownerOf(1)).to.equal(addr1.address);
    expect(await fighterCard.totalMinted()).to.equal(1);
    expect(await fighterCard.tokenURI(1)).to.equal(tokenURI);
  });

  it("Should not allow non-owners to mint", async function () {
    const tokenURI = "https://example.com/metadata.json";
await expect(
  fighterCard.connect(addr1).mintCard(addr1.address, tokenURI)
).to.be.revertedWithCustomError(fighterCard, "OwnableUnauthorizedAccount");
  });
});
