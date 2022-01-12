# VegaNFT
Simple NFT & Staking Contract | Code Challenge from Vega Protocol

## Summary
Gasless transactions, also popularly reffered to as meta-transactions are transactions wherein in the contect of ERC-20 tokens, the users doesn't need to pay for their gas fees.

For example, a user wants to make a payment in DAI for an NFT but they don't ave ETH in their wallet to pay the gass fee for the transaction. They only have DAI. The marketplace, for example, OpenSea might choose to pay the gas fees for the user and collect/transfer the DAI from the user's wallet to the NFT seller.

#### Task
The task is to write a mock ERC-20 token contract which supports meta-transactions enabling a token holder to grant or approve another user the rights to collect their tokens from their address.

Write a second smart contract for staking which will allow users who don't hold ETH to participate, i.e., staking ERC-20 tokens.

In your unit tests, test for the following scenarios and others you might want to add:
- Mock ERC-20 token holder can grant/approve anothe raddress rights to spend their tokens without holding ETH to pay gas fees (made possible via EIP712 typed messages and signatures off-chain)
- Another user with ETH can pay the gas fees fot the user without ETH and stake their tokens on their behalf in the staking contract
- User without ETH should see thir staked balance or amount increase at no cost in therms of ETH

Free to use Truffle or Hardhat.

## Implementation
#### VegaToken.sol
This is the contract for NFT, it inherits ERC721 from openzeppelin and call mint(of ERC721) and setTokenURI(of ERC721URIStorageEnumerable which will be explain later).
`ERC721URIStorageEnumerable.sol` contract is primarily used for token URI(link to the IPFS).

#### Marketplace.sol
This is the contract by which users can make their NFT `for sale` or `not for sale` on the marketplace and can buy NFTs on the marketplace.
It inherits `EIP712MetaTransaction.sol` to enable any user without ETH(for gas fee) to purchase NFT by using the other wallet(generally centralized backend server), is described below.
It also inherits `PriceConsumerV3.sol` which is used to get `ETH2DAI` price in this project.

## Deploy && Test
#### Configuration
```
npm install
npx hardhat node
```

#### Deployment
```
npx hardhat run --network [NETWORK-NAME] scripts/deploy.js
```

#### Test
```
npx hardhat test
```

**Special test script explained**
The most important one is to test the scenario user without any ETH purchase with other's wallet.
You can see `marketplace.sol` contract inherits the `EIP712MetaTransaction.sol` which is abstract contract. It means you can call the `executeMetaTransaction` which is defined in `EIP712MetaTransaction.sol` outside the smart contract.
This is how the test case cover the above case.


- Gas Report
```
·------------------------------------------|----------------------------|-------------|-----------------------------·
|           Solc version: 0.8.4            ·  Optimizer enabled: false  ·  Runs: 200  ·  Block limit: 30000000 gas  │
···········································|····························|·············|······························
|  Methods                                                                                                          │
················|··························|··············|·············|·············|···············|··············
|  Contract     ·  Method                  ·  Min         ·  Max        ·  Avg        ·  # calls      ·  usd (avg)  │
················|··························|··············|·············|·············|···············|··············
|  Marketplace  ·  addToMarketplace        ·           -  ·          -  ·      63234  ·           20  ·          -  │
················|··························|··············|·············|·············|···············|··············
|  Marketplace  ·  executeMetaTransaction  ·           -  ·          -  ·     171364  ·            1  ·          -  │
················|··························|··············|·············|·············|···············|··············
|  Marketplace  ·  purchase                ·      128679  ·     131346  ·     129346  ·            8  ·          -  │
················|··························|··············|·············|·············|···············|··············
|  Marketplace  ·  removeFromMarketplace   ·           -  ·          -  ·      40958  ·            5  ·          -  │
················|··························|··············|·············|·············|···············|··············
|  MockERC20    ·  approve                 ·           -  ·          -  ·      46893  ·           20  ·          -  │
················|··························|··············|·············|·············|···············|··············
|  MockERC20    ·  transfer                ·       52392  ·      52404  ·      52400  ·           30  ·          -  │
················|··························|··············|·············|·············|···············|··············
|  VegaToken    ·  mint                    ·           -  ·          -  ·     233450  ·           27  ·          -  │
················|··························|··············|·············|·············|···············|··············
|  VegaToken    ·  setApprovalForAll       ·       24811  ·      46723  ·      44732  ·           21  ·          -  │
················|··························|··············|·············|·············|···············|··············
|  Deployments                             ·                                          ·  % of limit   ·             │
···········································|··············|·············|·············|···············|··············
|  Marketplace                             ·     2671030  ·    2671054  ·    2671052  ·        8.9 %  ·          -  │
···········································|··············|·············|·············|···············|··············
|  MockERC20                               ·           -  ·          -  ·    1248991  ·        4.2 %  ·          -  │
···········································|··············|·············|·············|···············|··············
|  VegaToken                               ·           -  ·          -  ·    3664470  ·       12.2 %  ·          -  │
·------------------------------------------|--------------|-------------|-------------|---------------|-------------·
```

- Test Coverage
```
---------------------------------|----------|----------|----------|----------|----------------|
File                             |  % Stmts | % Branch |  % Funcs |  % Lines |Uncovered Lines |
---------------------------------|----------|----------|----------|----------|----------------|
 contracts/                      |    69.42 |       60 |    79.41 |    67.21 |                |
  EIP712Base.sol                 |      100 |      100 |      100 |      100 |                |
  EIP712MetaTransaction.sol      |    86.67 |       50 |      100 |    82.35 |       91,92,93 |
  ERC721URIStorageEnumerable.sol |    52.27 |     37.5 |       50 |       50 |... 257,260,261 |
  Marketplace.sol                |      100 |    95.83 |      100 |      100 |                |
  MockERC20.sol                  |      100 |      100 |      100 |      100 |                |
  PriceConsumerV3.sol            |    39.13 |    42.86 |    66.67 |    26.32 |... 3,98,99,101 |
  VegaStaking.sol                |      100 |      100 |      100 |      100 |                |
  VegaToken.sol                  |      100 |      100 |      100 |      100 |                |
---------------------------------|----------|----------|----------|----------|----------------|
All files                        |    69.42 |       60 |    79.41 |    67.21 |                |
---------------------------------|----------|----------|----------|----------|----------------|
```

You can also test the feature by using `npx hardhat node` and `npx hardhat console`.
