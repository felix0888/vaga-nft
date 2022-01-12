const { expect } = require("chai");
const { ethers } = require("hardhat");
const { BigNumber } = require("ethers");

describe("VegaToken", function() {
  const name = "Vega Token";
  const symbol = "VGT";
  let VegaToken;
  let Marketplace;
  let MockERC20;
  let vegaToken;
  let marketplace;
  let dai;
  let beneficiary;
  let alice;
  let bob;
  let signers;
  const daiInitialSupply = BigNumber.from(1000000).mul(
    BigNumber.from((1e18).toString())
  );

  beforeEach(async function() {
    VegaToken = await ethers.getContractFactory("VegaToken");
    MockERC20 = await ethers.getContractFactory("MockERC20");
    Marketplace = await ethers.getContractFactory("Marketplace");
    [ceo, vega, beneficiary, alice, bob, ...signers] = await ethers.getSigners();
    dai = await MockERC20.deploy("Dai Token", "DAI", daiInitialSupply);
    vegaToken = await VegaToken.deploy(name, symbol);
    marketplace = await Marketplace.deploy(vegaToken.address, dai.address);
  });

  describe("Deployment", function() {
    it("should set token name and symbol", async function() {
      expect(await vegaToken.name()).to.equal("Vega Token");
      expect(await vegaToken.symbol()).to.equal("VGT");
    });
  });

  describe("#mint", async function() {
    const tokenURI = "https://ipfs.io/Qmsdfu89su0s80d0g";

    this.beforeEach(async function() {
      this.tokenCount = await vegaToken.tokenCount();
      expect(
        await vegaToken.connect(alice).mint(tokenURI)
      ).to.emit(
        vegaToken,
        "Mint"
      ).withArgs(this.tokenCount + 1, alice.address);
    });

    it("should increase of balanceOf the minter", async function() {
      expect(await vegaToken.balanceOf(alice.address)).to.equal(1);
    });

    it("should create a new NFT token with given params", async function() {
      expect(await vegaToken.ownerOf(this.tokenCount + 1)).to.equal(alice.address);
      expect(await vegaToken.tokenURI(this.tokenCount + 1)).to.equal(tokenURI);
    });
  });
});