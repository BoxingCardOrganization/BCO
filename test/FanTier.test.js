const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("FanTier (Dynamic Version)", function () {
  let owner, user;
  let fanTier, mockFightfolio;

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();

    // Deploy and initialize the mock fightfolio
    const MockFightfolio = await ethers.getContractFactory("MockFightfolio");
    mockFightfolio = await MockFightfolio.deploy();
    await mockFightfolio.waitForDeployment();

    // Pre-set user fightfolio values for each test case
    await mockFightfolio.setFightfolioValue(user.address, 0); // default reset value
  });

  it("Should assign Casual tier for fightfolio value under $100", async function () {
    await mockFightfolio.setFightfolioValue(user.address, 99); // NOTE: Not parseEther
    const FanTier = await ethers.getContractFactory("FanTier");
    fanTier = await FanTier.deploy(await mockFightfolio.getAddress());
    await fanTier.waitForDeployment();

    expect(await fanTier.getFanTier(user.address)).to.equal(0);
  });

  it("Should assign Analyst tier for fightfolio value >= $100", async function () {
    await mockFightfolio.setFightfolioValue(user.address, 150);
    const FanTier = await ethers.getContractFactory("FanTier");
    fanTier = await FanTier.deploy(await mockFightfolio.getAddress());
    await fanTier.waitForDeployment();

    expect(await fanTier.getFanTier(user.address)).to.equal(1);
  });

  it("Should assign Historian tier for fightfolio value >= $500", async function () {
    await mockFightfolio.setFightfolioValue(user.address, 750);
    const FanTier = await ethers.getContractFactory("FanTier");
    fanTier = await FanTier.deploy(await mockFightfolio.getAddress());
    await fanTier.waitForDeployment();

    expect(await fanTier.getFanTier(user.address)).to.equal(2);
  });

  it("Should assign Purist tier for fightfolio value >= $1000", async function () {
    await mockFightfolio.setFightfolioValue(user.address, 1500);
    const FanTier = await ethers.getContractFactory("FanTier");
    fanTier = await FanTier.deploy(await mockFightfolio.getAddress());
    await fanTier.waitForDeployment();

    expect(await fanTier.getFanTier(user.address)).to.equal(3);
  });

  it("Should allow owner to update the Fightfolio address", async function () {
    const FanTier = await ethers.getContractFactory("FanTier");
    fanTier = await FanTier.deploy(await mockFightfolio.getAddress());
    await fanTier.waitForDeployment();

    const newFightfolio = await (await ethers.getContractFactory("MockFightfolio")).deploy();
    await fanTier.updateFightfolio(await newFightfolio.getAddress());

    expect(await fanTier.fightfolio()).to.equal(await newFightfolio.getAddress());
  });

  it("Should NOT allow non-owner to update the Fightfolio address", async function () {
    const FanTier = await ethers.getContractFactory("FanTier");
    fanTier = await FanTier.deploy(await mockFightfolio.getAddress());
    await fanTier.waitForDeployment();

    const newFightfolio = await (await ethers.getContractFactory("MockFightfolio")).deploy();

    await expect(
      fanTier.connect(user).updateFightfolio(await newFightfolio.getAddress())
    ).to.be.revertedWith("Only owner can update");
  });
});

