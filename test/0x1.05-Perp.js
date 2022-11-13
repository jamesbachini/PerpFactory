const { expect } = require("chai");
const { ethers } = require('hardhat');

describe("Perp", () => {
  let owner, user1, perpFactory, perp, pUSD, pGov;

  const deploy = async () => {
    [owner, user1] = await ethers.getSigners();
    const PerpFactory = await ethers.getContractFactory("PerpFactory");
    perpFactory = await PerpFactory.deploy();
    await perpFactory.deployed();
    const tx = await perpFactory.createPerp('BTC',10);
    const res = await tx.wait();
    const perpAddress = res.events[0].args.contractAddress;
    const Perp = await ethers.getContractFactory("Perp");
    perp = await Perp.attach(perpAddress);
    const pUSDAddress = await perpFactory.perpUSD();
    const Token = await ethers.getContractFactory("Token");
    pUSD = await Token.attach(pUSDAddress);
    const pGovAddress = await perpFactory.perpGov();
    pGov = await Token.attach(pGovAddress);
  }

  describe("Deployment", () => {
    it("Should return the correcet ticker symbol", async () => {
      await deploy();
      const ticker = await perp.asset();
      expect(ticker).to.equal('BTC');
    });
  });

  describe("PUSD.sol", () => {
    it("Initial balance should be zero", async () => {
      const balance = await pUSD.balanceOf(owner.address);
      expect(balance).to.equal(0);
    });
  });

  describe("PerpFactory.sol", () => {
    it("Should accept deposits", async () => {
      const ethAmount = ethers.utils.parseEther('1');
      const tx = await perpFactory.deposit({value: ethAmount});
      const balance = await pUSD.balanceOf(owner.address);
      expect(balance).to.greaterThan(0);
    });

    it("Should accept withdrawals", async () => {
      const pusdBalance1 = await pUSD.balanceOf(owner.address);
      const ethBalance1 = await ethers.provider.getBalance(owner.address);
      const pusdAmount = ethers.utils.parseEther('100');
      const tx = await perpFactory.withdraw(pusdAmount);
      const pusdBalance2 = await pUSD.balanceOf(owner.address);
      const ethBalance2 = await ethers.provider.getBalance(owner.address);
      expect(pusdBalance2).to.lessThan(pusdBalance1);
      expect(ethBalance2).to.greaterThan(ethBalance1);
    });

    it("Should allow 3rd party creation of perps", async () => {
      const newPerp = await perpFactory.createPerp('FOOBAR',100);
      const perpCount = await perpFactory.perpCount();
      expect(perpCount).to.equal(2);
    });
  });

  describe("Perp.sol", () => {
    it("Oracle should update price", async () => {
      await perp.priceUpdate(10000);
      const spot = await perp.spot();
      const price = await perp.price();
      expect(spot).to.equal(10000);
      expect(price).to.equal(10000);
    });

    it("Non-Oracle should not update price", async () => {
      await expect(perp.connect(user1).priceUpdate(1501)).to.be.revertedWith("Oracles Only");
    });

    it("Should allow oracle to add new oracle", async () => {
      const vitalik = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
      const bool1 = await perp.oracles(vitalik);
      expect(bool1).to.equal(false);
      await perp.updateOracle(vitalik, true);
      const bool2 = await perp.oracles(vitalik);
      expect(bool2).to.equal(true);
    });

    it("calculateFee should be zero initially", async () => {
      const pusdAmount = ethers.utils.parseEther('100');
      const fee = await perp.calculateFee(pusdAmount,true);
      expect(fee).to.equal(0);
    });

    it("Should allow owner to place a long trade", async () => {
      const pusdBalance1 = await pUSD.balanceOf(owner.address);
      const pusdAmount = ethers.utils.parseEther('100');
      await pUSD.approve(perp.address, pusdAmount);
      await perp.placeTrade(pusdAmount, true);
      const pusdBalance2 = await pUSD.balanceOf(owner.address);
      expect(pusdBalance2).to.lessThan(pusdBalance1);
      const perpBalance = await perp.calculatePosition(owner.address);
      expect(perpBalance).to.equal(pusdAmount);
    });

    it("Price should move away from owners position", async () => {
      const perpBalance1 = await perp.calculatePosition(owner.address);
      await perp.priceUpdate(9500);
      const perpBalance2 = await perp.calculatePosition(owner.address);
      expect(perpBalance2).to.lessThan(perpBalance1);
      expect(perpBalance2).to.greaterThan(0);
      await perp.priceUpdate(8000);
      const perpBalance3 = await perp.calculatePosition(owner.address);
      expect(perpBalance3).to.equal(0);
    });

    it("Position should get liquidated", async () => {
      const liquidatorBalance1 = await pUSD.balanceOf(user1.address);
      await perp.priceUpdate(9020);
      const perpBalance1 = await perp.calculatePosition(owner.address);
      const tx = await perp.connect(user1).liquidatePosition(owner.address);
      await tx.wait();
      const perpBalance2 = await perp.calculatePosition(owner.address);
      expect(perpBalance2).to.equal(0);
      const liquidatorBalance2 = await pUSD.balanceOf(user1.address);
      expect(liquidatorBalance2).to.greaterThan(liquidatorBalance1);
      const safuBalance = await pUSD.balanceOf(perp.address);
      expect(safuBalance).to.greaterThan(0);
    });

    it("Should allow owner to place a short trade", async () => {
      await perp.priceUpdate(10000);
      const pusdBalance1 = await pUSD.balanceOf(owner.address);
      const pusdAmount = ethers.utils.parseEther('100');
      await pUSD.approve(perp.address, pusdAmount);
      await perp.placeTrade(pusdAmount, false);
      const pusdBalance2 = await pUSD.balanceOf(owner.address);
      expect(pusdBalance2).to.lessThan(pusdBalance1);
      const perpBalance = await perp.calculatePosition(owner.address);
      expect(perpBalance).to.equal(pusdAmount);
    });

    it("Should be able to close trade", async () => {
      await perp.priceUpdate(9990);
      const pusdBalance1 = await pUSD.balanceOf(owner.address);
      const perpBalance = await perp.calculatePosition(owner.address);
      expect(perpBalance).to.greaterThan(0);
      await perp.closeTrade();
      const pusdBalance2 = await pUSD.balanceOf(owner.address);
      expect(pusdBalance2).to.greaterThan(pusdBalance1);
    });
  });

});
