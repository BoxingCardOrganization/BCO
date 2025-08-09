const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TradingRing Contract", function () {
  let owner, addr1, tradingRing, fanTier, mockFightfolio;

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();

    // Deploy mock Fightfolio and set addr1 value BEFORE deploying FanTier
    const MockFightfolio = await ethers.getContractFactory("MockFightfolio");
    mockFightfolio = await MockFightfolio.deploy();
    await mockFightfolio.waitForDeployment();

    await mockFightfolio.setFightfolioValue(addr1.address, 600); // Should result in tier 2 (Historian)

    // Deploy FanTier AFTER setting value in mockFightfolio
    const FanTier = await ethers.getContractFactory("FanTier");
    fanTier = await FanTier.deploy(await mockFightfolio.getAddress());
    await fanTier.waitForDeployment();

    // Deploy TradingRing
    const TradingRing = await ethers.getContractFactory("TradingRing");
    tradingRing = await TradingRing.deploy(await fanTier.getAddress(), owner.address);
    await tradingRing.waitForDeployment();
  });

  it("Should post a message and emit it with fan tier", async function () {
    const message = "Fight for glory!";
    const tx = await tradingRing.connect(addr1).postMessage(message);
    const receipt = await tx.wait();
    const block = await ethers.provider.getBlock(receipt.blockNumber);
    const timestamp = block.timestamp;

    await expect(tx)
      .to.emit(tradingRing, "MessagePosted")
      .withArgs(addr1.address, message, 2, timestamp); // 2 = Historian tier
  });

  it("Should store message with correct fan tier and sender", async function () {
    const content = "Another post from me";
    await tradingRing.connect(addr1).postMessage(content);

    const messages = await tradingRing.getMessages();
    expect(messages.length).to.equal(1);
    expect(messages[0].sender).to.equal(addr1.address);
    expect(messages[0].content).to.equal(content);
    expect(messages[0].fanTier).to.equal(2); // 2 = Historian tier
  });
});


