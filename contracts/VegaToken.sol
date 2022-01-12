// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./EIP712MetaTransaction.sol";
import "./ERC721URIStorageEnumerable.sol";
import "openzeppelin-solidity/contracts/token/ERC721/ERC721.sol";
import "openzeppelin-solidity/contracts/token/ERC20/utils/SafeERC20.sol";

contract VegaToken is ERC721URIStorageEnumerable, EIP712MetaTransaction {

    address public beneficiary; // fee-to address

    uint256 public tokenCount;

    event Mint(
        uint indexed tokenId,
        address indexed minter
    );

    constructor(
        string memory _name,
        string memory _symbol
    )
        ERC721(_name, _symbol)
        EIP712Base(DOMAIN_NAME, DOMAIN_VERSION, block.chainid)
    {
    }

    function mint(string memory _tokenURI) external {
        tokenCount++;
        _mint(_msgSender(), tokenCount);
        _setTokenURI(tokenCount, _tokenURI);

        emit Mint(tokenCount, _msgSender());
    }

    function _msgSender() internal view override returns (address) {
        return msgSender();
    }
}
