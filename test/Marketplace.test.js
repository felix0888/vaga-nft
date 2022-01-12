require("dotenv").config();

const { expect } = require("chai");
const { ethers } = require("hardhat");
const { BigNumber } = require("ethers");
const sigUtil = require('eth-sig-util');

const ADDRESS_ZERO = "0x0000000000000000000000000000000000000000";

const privateKey = process.env.PRIVATE_KEY;
const signingKey = new ethers.Wallet(privateKey, ethers.provider);

const domainType = [
  {
    name: "name",
    type: "string"
  },
  {
    name: "version",
    type: "string"
  },
  {
    name: "chainId",
    type: "uint256"
  },
  {
    name: "verifyingContract",
    type: "address"
  },
];

const metaTransactionType = [
  {
    name: "nonce",
    type: "uint256"
  },
  {
    name: "from",
    type: "address"
  },
  {
    name: "functionSignature",
    type: "bytes"
  }
];

const getTransactionData = async (domainData, nonce, functionSignature) => {
  const message = {
    nonce: parseInt(nonce),
    from: signingKey.address,
    functionSignature: functionSignature
  };
  const dataToSign = {
      types: {
          EIP712Domain: domainType,
          MetaTransaction: metaTransactionType
      },
      domain: domainData,
      primaryType: "MetaTransaction",
      message: message
  };

  const signature = sigUtil.signTypedData_v4(Buffer.from(privateKey.substring(2, 66), 'hex'), {
      data: dataToSign
  });

  let r = signature.slice(0, 66);
  let s = "0x".concat(signature.slice(66, 130));
  let v = "0x".concat(signature.slice(130, 132));
  let value = parseInt(v, 16);
  if (![27, 28].includes(value)) {
    v = (value + 27).toString(16);
  }

  return { r, s, v };
}

describe("Marketplace", function() {
  const name = "Vega Token";
  const symbol = "VGT";
  let VegaToken, Marketplace, MockERC20;
  let vegaToken, marketplace, dai;
  let deployer, alice, bob, carol, signers;

  let domainData;
  let chainId;

  const daiInitialSupply = BigNumber.from(1000000).mul(
    BigNumber.from((1e18).toString())
  );

  before(async function() {
    chainId = (await ethers.provider.getNetwork()).chainId;
  });

  beforeEach(async function() {
    VegaToken = await ethers.getContractFactory("VegaToken");
    Marketplace = await ethers.getContractFactory("Marketplace");
    MockERC20 = await ethers.getContractFactory("MockERC20");
    [deployer, alice, bob, carol, ...signers] = await ethers.getSigners();
    dai = await MockERC20.deploy("Dai Token", "DAI", daiInitialSupply);
    vegaToken = await VegaToken.deploy(name, symbol);
    marketplace = await Marketplace.deploy(vegaToken.address, dai.address);
  });

  describe("Deployment", function() {
    it("should set the Vega Token and DAI address", async function() {
      expect(await marketplace.vegaToken()).to.equal(vegaToken.address);
      expect(await marketplace.dai()).to.equal(dai.address);
    });
  });

  describe("#addToMarketPlace", function() {
    const tokenURI = "https://ipfs.io/Qmsdfu89su0s80d0g";
    const price = ethers.utils.parseEther("2"); // 2 ether

    beforeEach(async function() {
      this.tokenCount = await vegaToken.tokenCount();
      await vegaToken.connect(alice).mint(tokenURI);
    });

    it("should be reverted if invalid _tokenId is given", async function() {
      await expect(
        marketplace.addToMarketplace(0, price)
      ).to.be.revertedWith(
        "VegaMarket: INVALID_TOKEN_ID"
      );

      await expect(
        marketplace.addToMarketplace(this.tokenCount + 2, price)
      ).to.be.revertedWith(
        "VegaMarket: INVALID_TOKEN_ID"
      );
    });

    it("should be reverted if _price is 0", async function() {
      await expect(
        marketplace.connect(alice).addToMarketplace(this.tokenCount + 1, 0)
      ).to.be.revertedWith(
        "VegaMarket: INVALID_PRICE"
      );
    });

    it("should be reverted if non-token-owner tries", async function() {
      await expect(
        marketplace.connect(bob).addToMarketplace(this.tokenCount + 1, price)
      ).to.be.revertedWith(
        "VegaMarket: INVALID_OWNER"
      );
    });

    it("should be reverted if the VegaToken contract doesn't approve Marketplace contract", async function() {
      await expect(
        marketplace.connect(alice).addToMarketplace(this.tokenCount + 1, price)
      ).to.be.revertedWith(
        "VegaMarket: NO_APPROVAL"
      );
    })

    it("should be reverted if the NFT is already on marketplace", async function() {
      await vegaToken.connect(alice).setApprovalForAll(marketplace.address, true);
      await marketplace.connect(alice).addToMarketplace(this.tokenCount + 1, price);
      await expect(
        marketplace.connect(alice).addToMarketplace(this.tokenCount + 1, price)
      ).to.be.revertedWith(
        "VegaMarket: TOKEN_ON_SALE"
      );
    });

    it("should set the token price with given", async function() {
      await vegaToken.connect(alice).setApprovalForAll(marketplace.address, true);
      await marketplace.connect(alice).addToMarketplace(this.tokenCount + 1, price);
      expect(await marketplace.tokenPrice(this.tokenCount + 1)).to.equal(price);
    });

    it("should emit SetForSale event", async function() {
      await vegaToken.connect(alice).setApprovalForAll(marketplace.address, true);
      const block = await ethers.provider.getBlock('latest');
      await expect(
        marketplace.connect(alice).addToMarketplace(this.tokenCount + 1, price)
      ).to.emit(
        marketplace,
        "SetForSale"
      ).withArgs(this.tokenCount + 1, price, alice.address, block.timestamp + 1);
    });
  });

  describe("#removeFromMarketPlace", function() {
    const tokenURI = "https://ipfs.io/Qmsdfu89su0s80d0g";
    const price = ethers.utils.parseEther("2"); // 2 ether

    beforeEach(async function() {
      this.tokenCount = await vegaToken.tokenCount();
      await vegaToken.connect(alice).mint(tokenURI);
      await vegaToken.connect(alice).setApprovalForAll(marketplace.address, true);
      await marketplace.connect(alice).addToMarketplace(this.tokenCount + 1, price)
    });

    it("should be reverted if invalid _tokenId is given", async function() {
      await expect(
        marketplace.removeFromMarketplace(0)
      ).to.be.revertedWith(
        "VegaMarket: INVALID_TOKEN_ID"
      );

      await expect(
        marketplace.removeFromMarketplace(this.tokenCount + 2)
      ).to.be.revertedWith(
        "VegaMarket: INVALID_TOKEN_ID"
      );
    });

    it("should be reverted if non-token-owner tries", async function() {
      await expect(
        marketplace.connect(bob).removeFromMarketplace(this.tokenCount + 1)
      ).to.be.revertedWith(
        "VegaMarket: INVALID_OWNER"
      );
    });

    it("should be reverted if the VegaToken contract doesn't approve Marketplace contract", async function() {
      await vegaToken.connect(alice).setApprovalForAll(marketplace.address, false);
      await expect(
        marketplace.connect(alice).removeFromMarketplace(this.tokenCount + 1)
      ).to.be.revertedWith(
        "VegaMarket: NO_APPROVAL"
      );
    })

    it("should be reverted if the NFT is not on marketplace", async function() {
      await vegaToken.connect(alice).setApprovalForAll(marketplace.address, true);
      await marketplace.connect(alice).removeFromMarketplace(this.tokenCount + 1);
      await expect(
        marketplace.connect(alice).removeFromMarketplace(this.tokenCount + 1)
      ).to.be.revertedWith(
        "VegaMarket: TOKEN_NOT_ON_SALE"
      );
    });

    it("should remove the token price", async function() {
      await marketplace.connect(alice).removeFromMarketplace(this.tokenCount + 1);
      expect(await marketplace.tokenPrice(this.tokenCount + 1)).to.equal(0);
    });

    it("should emit SetForSale event", async function() {
      const block = await ethers.provider.getBlock('latest');
      expect(
        marketplace.connect(alice).removeFromMarketplace(this.tokenCount + 1)
      ).to.emit(
        marketplace,
        "SetForSale"
      ).withArgs(this.tokenCount + 1, 0, alice.address, block.timestamp + 1);
    });
  });

  describe("#purchase", function() {
    const tokenURI = "https://ipfs.io/Qmsdfu89su0s80d0g";
    const price = ethers.utils.parseEther("2"); // 2 ether

    beforeEach(async function() {
      this.tokenCount = await vegaToken.tokenCount();
      await vegaToken.connect(alice).mint(tokenURI);
      await vegaToken.connect(alice).setApprovalForAll(marketplace.address, true);
      await marketplace.connect(alice).addToMarketplace(this.tokenCount + 1, price);
      await dai.transfer(alice.address, daiInitialSupply.div(100));
      await dai.transfer(bob.address, daiInitialSupply.div(100));
      await dai.transfer(carol.address, daiInitialSupply.div(100));

      this.priceInDAI = await marketplace.getTokenPriceInDAI(this.tokenCount + 1);
      await dai.connect(bob).approve(marketplace.address, this.priceInDAI.toString());
      await dai.connect(carol).approve(marketplace.address, this.priceInDAI.toString());
    });

    it("should be reverted if invalid token id is given", async function() {
      await expect(
        marketplace.connect(alice).purchase(
          0, ADDRESS_ZERO, this.priceInDAI
        )
      ).to.be.revertedWith(
        "VegaMarket: INVALID_TOKEN_ID"
      );

      await expect(
        marketplace.connect(alice).purchase(
          this.tokenCount + 2, ADDRESS_ZERO, this.priceInDAI
        )
      ).to.be.revertedWith(
        "VegaMarket: INVALID_TOKEN_ID"
      );
    });

    it("should be reverted if token is not on sale", async function() {
      await marketplace.connect(alice).removeFromMarketplace(this.tokenCount + 1);
      await expect(
        marketplace.connect(alice).purchase(
          this.tokenCount + 1, ADDRESS_ZERO, this.priceInDAI
        )
      ).to.be.revertedWith(
        "VegaMarket: TOKEN_NOT_ON_SALE"
      );
    });

    it("should transfer DAI token from buyer to seller - buyer in param", async function() {
      const aliceDAIBalance = await dai.balanceOf(alice.address);
      const bobDAIBalance = await dai.balanceOf(bob.address);
      await marketplace.connect(bob).purchase(
        this.tokenCount + 1, ADDRESS_ZERO, this.priceInDAI
      );
      expect(await dai.balanceOf(alice.address)).to.equal(
        BigNumber.from(aliceDAIBalance).add(BigNumber.from(this.priceInDAI))
      );
      expect(await dai.balanceOf(bob.address)).to.equal(
        BigNumber.from(bobDAIBalance).sub(BigNumber.from(this.priceInDAI))
      );
    });

    it("should transfer DAI token from buyer to seller - buyer not in param", async function() {
      const aliceDAIBalance = await dai.balanceOf(alice.address);
      const bobDAIBalance = await dai.balanceOf(bob.address);
      await marketplace.connect(carol).purchase(
        this.tokenCount + 1, bob.address, this.priceInDAI
      );
      expect(await dai.balanceOf(alice.address)).to.equal(
        BigNumber.from(aliceDAIBalance).add(BigNumber.from(this.priceInDAI))
      );
      expect(await dai.balanceOf(bob.address)).to.equal(
        BigNumber.from(bobDAIBalance).sub(BigNumber.from(this.priceInDAI))
      );
    });

    it("should transfer ownership of the NFT token - buyer in param", async function() {
      await marketplace.connect(bob).purchase(
        this.tokenCount + 1, ADDRESS_ZERO, this.priceInDAI
      );
      expect(await vegaToken.ownerOf(this.tokenCount + 1)).to.equal(bob.address);
    });

    it("should transfer ownership of the NFT token - buyer not in param", async function() {
      await marketplace.connect(carol).purchase(
        this.tokenCount + 1, bob.address, this.priceInDAI
      );
      expect(await vegaToken.ownerOf(this.tokenCount + 1)).to.equal(bob.address);
    });

    it("should decrease the ETH balance of buyer as gas fee", async function() {
      const bobETHBalance = await ethers.provider.getBalance(bob.address);
      await marketplace.connect(bob).purchase(
        this.tokenCount + 1, ADDRESS_ZERO, this.priceInDAI
      );
      expect(await ethers.provider.getBalance(bob.address)).to.lt(bobETHBalance);
    });

    it("should set the token price to 0", async function() {
      await marketplace.connect(bob).purchase(
        this.tokenCount + 1, ADDRESS_ZERO, this.priceInDAI
      );
      expect(await marketplace.tokenPrice(this.tokenCount + 1)).to.equal(0);
    });

    it("should emit Purchase event", async function() {
      const block = await ethers.provider.getBlock('latest');
      await expect(
        marketplace.connect(bob).purchase(this.tokenCount + 1, ADDRESS_ZERO, this.priceInDAI)
      ).to.emit(
        marketplace,
        "Purchase"
      ).withArgs(this.tokenCount + 1, bob.address, block.timestamp + 1);
    });

    context("eip712 meta transaction", function() {
      beforeEach(async function() {
        domainData = {
          name: "vega.protocol",
          version: "1",
          chainId: chainId,
          verifyingContract: marketplace.address
        };
      });
  
      it("should purchase on the behalf of other user", async function() {
        const aliceDAIBalance = await dai.balanceOf(alice.address);
        const bobDAIBalance = await dai.balanceOf(bob.address);
        const bobETHBalance = await ethers.provider.getBalance(bob.address);

        const nonce = await marketplace.getNonce(signingKey.address);
        const purchaseFunctionSig = marketplace.interface.encodeFunctionData(
          "purchase",
          [this.tokenCount + 1, bob.address, this.priceInDAI]
        );
        let { r, s, v } = await getTransactionData(domainData, nonce, purchaseFunctionSig);
        await marketplace.executeMetaTransaction(signingKey.address, purchaseFunctionSig, r, s, v);

        expect(await vegaToken.ownerOf(this.tokenCount + 1)).to.equal(bob.address);

        expect(await dai.balanceOf(alice.address)).to.equal(
          BigNumber.from(aliceDAIBalance).add(BigNumber.from(this.priceInDAI))
        );
        expect(await dai.balanceOf(bob.address)).to.equal(
          BigNumber.from(bobDAIBalance).sub(BigNumber.from(this.priceInDAI))
        );

        expect(await ethers.provider.getBalance(bob.address)).to.equal(bobETHBalance);

        expect(await marketplace.tokenPrice(this.tokenCount + 1)).to.equal(0);
      });
    });
  });
});
