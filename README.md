# Staking Contracts

This repository contains three Solidity contracts that implement staking functionality.

## BasicStaking

This is a basic staking contract that allows users to stake StakingTokens and receive xTokens in return. The contract defines two functions: `enter` and `leave`.

The `enter` function allows a user to stake a certain amount of the staking token and receive a proportional amount of xTokens in return. The proportion is based on the ratio of staking tokens to xTokens currently in the contract.

The `leave` function allows a user to redeem a certain amount of xTokens and receive a proportional amount of the staking token back.

## ComplexRewardStaking

This is a more complex staking contract that allows users to stake tokens and receive rewards. The contract defines several variables and mappings to keep track of staking and reward information. The `constructor` sets the staking and reward tokens for the contract. The contract owner can access certain functions through the `onlyContractOwner` modifier.

The staking and reward functions are defined as `stakeTokens`, `withdrawTokens`, `calculateEarned`, and `claimRewards`.

Users can stake tokens and withdraw tokens, and their earned rewards can be calculated and claimed.

The `rewardUpdate` modifier updates the user's rewards.

The contract calculates the reward per token and the last time rewards were updated using `calculateRewardPerToken` and `calculateLastRewardTime` functions, respectively.

The contract also calculates the per-second reward payout and the accumulated reward per token using the `notifyRewardDistribution` function.

Overall, this contract is designed to incentivize users to stake tokens by offering rewards, and it allows the contract owner to manage the reward distribution and duration.

## PeriodicRewardStaking

This is a staking contract that allows users to stake tokens and receive rewards in a periodic manner.

The contract defines the staking and reward tokens as `stakingToken` and `rewardToken`, respectively.

The contract keeps track of user balances and rewards with `userBalance`, `userRewardIndex`, and `userEarned` mappings.

The contract has functions that allow users to stake and unstake tokens with `stakeTokens` and `unstakeTokens`, respectively.

Users can also claim their earned rewards with the `claimReward` function. The `adjustRewardIndex` function allows the contract owner to adjust the reward index based on incoming rewards.

The contract calculates the rewards earned by a user with the `calculateEarnedRewards` function and the `computeRewards` function. The `recalculateRewards` function updates a user's earned rewards and reward index.

This contract is designed to reward users for staking tokens and allows a contract owner to adjust the rewards periodically. Overall, this contract is a basic staking contract that is suitable for small-scale periodic reward distributions.

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat run scripts/{name.js}
```
