// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./VegaToken.sol";
import "./PriceConsumerV3.sol";
import "openzeppelin-solidity/contracts/token/ERC20/utils/SafeERC20.sol";
import "./EIP712MetaTransaction.sol";
import "hardhat/console.sol";

contract Marketplace is PriceConsumerV3, EIP712MetaTransaction {
    using SafeERC20 for IERC20;

    VegaToken public vegaToken;
    IERC20 public dai;

    mapping (uint256 => uint256) public tokenPrice;

    event SetForSale(
        uint256 indexed _tokenId,
        uint256 _price,
        address indexed _seller,
        uint256 _timestamp
    );

    event Purchase(
        uint256 indexed _tokenId,
        address indexed _buyer,
        uint256 timestamp
    );

    constructor(address _vegaToken, address _dai) EIP712Base(DOMAIN_NAME, DOMAIN_VERSION, block.chainid) {
        vegaToken = VegaToken(_vegaToken);
        dai = IERC20(_dai);
    }

    function addToMarketplace(uint256 _tokenId, uint256 _price) public {
        require(_tokenId > 0 && _tokenId <= vegaToken.tokenCount(), "VegaMarket: INVALID_TOKEN_ID");
        require(_price > 0, "VegaMarket: INVALID_PRICE");
        require(tokenPrice[_tokenId] == 0, "VegaMarket: TOKEN_ON_SALE");
        address owner = vegaToken.ownerOf(_tokenId);
        require(owner == msgSender(), "VegaMarket: INVALID_OWNER");
        require(vegaToken.isApprovedForAll(msgSender(), address(this)), "VegaMarket: NO_APPROVAL");
        tokenPrice[_tokenId] = _price;
        emit SetForSale(_tokenId, _price, msgSender(), block.timestamp);
    }

    function removeFromMarketplace(uint256 _tokenId) public {
        require(_tokenId > 0 && _tokenId <= vegaToken.tokenCount(), "VegaMarket: INVALID_TOKEN_ID");
        require(tokenPrice[_tokenId] > 0, "VegaMarket: TOKEN_NOT_ON_SALE");
        address owner = vegaToken.ownerOf(_tokenId);
        require(owner == msgSender(), "VegaMarket: INVALID_OWNER");
        require(vegaToken.isApprovedForAll(msgSender(), address(this)), "VegaMarket: NO_APPROVAL");
        tokenPrice[_tokenId] = 0;
        emit SetForSale(_tokenId, 0, msgSender(), block.timestamp);
    }

    function purchase(uint256 _tokenId, address _buyer, uint256 _daiAmount) public {
        require(_tokenId > 0 && _tokenId <= vegaToken.tokenCount(), "VegaMarket: INVALID_TOKEN_ID");
        require(tokenPrice[_tokenId] > 0, "VegaMarket: TOKEN_NOT_ON_SALE");
        _validateDAIAmount(_tokenId, _daiAmount);
        address owner = vegaToken.ownerOf(_tokenId);
        address buyer = _buyer==address(0) ? msgSender() : _buyer;

        dai.safeTransferFrom(buyer, owner, _daiAmount);
        vegaToken.safeTransferFrom(owner, buyer, _tokenId);

        tokenPrice[_tokenId] = 0;

        emit Purchase(_tokenId, buyer, block.timestamp);
    }

    function _validateDAIAmount(uint256 _tokenId, uint256 _daiAmount) private view {
        require(getTokenPriceInDAI(_tokenId) >= _daiAmount, "VegaMarket: INSUFFICIENT_FUND");
    }

    function getTokenPriceInDAI(uint _tokenId) public view returns (uint256) {
        uint256 price = tokenPrice[_tokenId];
        uint256 eth2usd = uint256(getETH2USD()); // just think 1 DAI is 1 USD to make it simple
        return price * eth2usd;
    }

    function getETH2USD() private view returns (int256) {
        return getThePriceEthUsd() / 10**8;
    }
}
