# PerpFactory
## Permissionless Perpetual Futures Contracts

![screenshot](https://github.com/jamesbachini/PerpFactory/blob/master/docs/screenshot.png?raw=true)

Following the collapse of FTX it would be nice to demonstrate a perpetual swap contract written in Solidity for Ethereum.

The PerpFactory.sol contract creates a USD stablecoin and and a governance token. We can then create a perpetual futures contract by calling createPerp with a asset name and the leverage amount.

The contracts are set up to use a fixed amount of leverage. Fees and margin requirements are adjustable by the creator.

Trading fees are split two ways with half being stored in the contract to act as a SAFU fund and half being sent back to PerpFactory to get redistributed to token holders.

Liquidation fees get split three ways with the addition of a fee for the liquidator.

Any fees sent back to PerpFactory.sol get a distribution of the governance token. This creates a nice dynamic where if you get liquidated at least you get some governance tokens. This adjusts the risks to reward on trades and incentivises trading while also boostering the SAFU funds in the contract.

This is an experiment and nowhere near ready for use with real funds.

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat run scripts/deploy.js
```
