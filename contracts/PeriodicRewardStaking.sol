// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title Contract for discrete rewards distribution through staking
 */
contract PeriodicRewardStaking {
    // Tokens staked by users and the token used as reward.
    IERC20 public immutable stakingToken;
    IERC20 public immutable rewardToken;

    // Mapping of user addresses to their staked balances and rewards.
    mapping(address => uint256) public userBalance;
    mapping(address => uint256) private userRewardIndex;
    mapping(address => uint256) private userEarned;

    // Reward index and total staked tokens.
    uint256 private currentRewardIndex;
    uint256 public totalStaked;

    // Precision multiplier.
    uint256 private constant PRECISION = 1e18;

    /**
     * @dev Constructs a new StakingRewards contract.
     * @param stakingTokenAddress The address of the token being staked.
     * @param rewardTokenAddress The address of the reward token.
     */
    constructor(address stakingTokenAddress, address rewardTokenAddress) {
        stakingToken = IERC20(stakingTokenAddress);
        rewardToken = IERC20(rewardTokenAddress);
    }

    /**
     * @dev Stakes tokens and recalculates user's rewards.
     * @param stakeAmount The amount to stake.
     */
    function stakeTokens(uint256 stakeAmount) external {
        recalculateRewards(msg.sender);

        userBalance[msg.sender] += stakeAmount;
        totalStaked += stakeAmount;

        stakingToken.transferFrom(msg.sender, address(this), stakeAmount);
    }

    /**
     * @dev Unstakes tokens and recalculates user's rewards.
     * @param unstakeAmount The amount to unstake.
     */
    function unstakeTokens(uint256 unstakeAmount) external {
        recalculateRewards(msg.sender);

        userBalance[msg.sender] -= unstakeAmount;
        totalStaked -= unstakeAmount;

        stakingToken.transfer(msg.sender, unstakeAmount);
    }

    /**
     * @dev Rewards the user and updates their rewards.
     * @return The reward amount.
     */
    function claimReward() external returns (uint256) {
        recalculateRewards(msg.sender);

        uint256 reward = userEarned[msg.sender];
        if (reward > 0) {
            userEarned[msg.sender] = 0;
            rewardToken.transfer(msg.sender, reward);
        }

        return reward;
    }

    /**
     * @dev Updates the reward index based on incoming rewards.
     * @param newReward The new reward amount.
     */
    function adjustRewardIndex(uint256 newReward) external {
        rewardToken.transferFrom(msg.sender, address(this), newReward);
        currentRewardIndex += (newReward * PRECISION) / totalStaked;
    }

    /**
     * @dev Calculates the rewards earned by a user.
     * @param userAddress The address of the user.
     * @return The earned rewards.
     */
    function calculateEarnedRewards(
        address userAddress
    ) external view returns (uint256) {
        return userEarned[userAddress] + computeRewards(userAddress);
    }

    /**
     * @dev Computes the rewards earned by a user.
     * @param userAddress The address of the user.
     * @return The earned rewards.
     */
    function computeRewards(
        address userAddress
    ) private view returns (uint256) {
        uint256 balance = userBalance[userAddress];
        return
            (balance * (currentRewardIndex - userRewardIndex[userAddress])) /
            PRECISION;
    }

    /**
     * @dev Recalculates a user's earned rewards and updates their reward index.
     * @param userAddress The address of the user.
     */
    function recalculateRewards(address userAddress) private {
        userEarned[userAddress] += computeRewards(userAddress);
        userRewardIndex[userAddress] = currentRewardIndex;
    }
}
