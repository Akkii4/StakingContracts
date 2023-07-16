// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title ComplexRewardStaking
 * @dev A contract for staking tokens and receiving rewards
 */
contract ComplexRewardStaking {
    // Token being staked
    IERC20 public stakingTokenInstance;

    // Token used for rewards
    IERC20 public rewardTokenInstance;

    // Contract owner
    address public contractOwner;

    // Reward duration in seconds
    uint public rewardDuration;

    // Time when rewards end
    uint public rewardEndTime;

    // Last updated time or reward end time, the smaller one
    uint public lastUpdated;

    // Per second Reward payout
    uint public rewardPerSec;

    // Sum of (rewardPerSec * difference of lastupdatedTime * 1e18) / total staked supply
    uint public accumulatedRewardPerToken;

    // Mapping of account address to accumulatedRewardPerToken
    mapping(address => uint) public userAccumulatedReward;

    // Mapping of account address to rewards that are claimable
    mapping(address => uint) public claimableRewards;

    // Total staked tokens
    uint public stakedSupply;

    // Mapping of user address to their staked tokens
    mapping(address => uint) public stakeBalance;

    /**
     * @dev RewardStaking contract constructor
     * @param _stakingToken Token being staked
     * @param _rewardToken Token used for rewards
     */
    constructor(address _stakingToken, address _rewardToken) {
        contractOwner = msg.sender;
        stakingTokenInstance = IERC20(_stakingToken);
        rewardTokenInstance = IERC20(_rewardToken);
    }

    // Modifier for owner only access
    modifier onlyContractOwner() {
        require(msg.sender == contractOwner, "Unauthorized access");
        _;
    }

    // Modifier to update user's rewards
    modifier rewardUpdate(address _user) {
        accumulatedRewardPerToken = calculateRewardPerToken();
        lastUpdated = calculateLastRewardTime();

        if (_user != address(0)) {
            claimableRewards[_user] = calculateEarned(_user);
            userAccumulatedReward[_user] = accumulatedRewardPerToken;
        }
        _;
    }

    // Calculate last reward applicable time
    function calculateLastRewardTime() public view returns (uint) {
        return _min(rewardEndTime, block.timestamp);
    }

    // Calculate reward per token
    function calculateRewardPerToken() public view returns (uint) {
        if (stakedSupply == 0) {
            return accumulatedRewardPerToken;
        }
        return
            accumulatedRewardPerToken +
            (rewardPerSec * (calculateLastRewardTime() - lastUpdated) * 1e18) /
            stakedSupply;
    }

    // Stake a specified amount of tokens
    function stakeTokens(uint _amount) external rewardUpdate(msg.sender) {
        require(_amount > 0, "Amount must be greater than 0");
        stakingTokenInstance.transferFrom(msg.sender, address(this), _amount);
        stakeBalance[msg.sender] += _amount;
        stakedSupply += _amount;
    }

    // Withdraw a specified amount of tokens
    function withdrawTokens(uint _amount) external rewardUpdate(msg.sender) {
        require(_amount > 0, "Amount must be greater than 0");
        stakeBalance[msg.sender] -= _amount;
        stakedSupply -= _amount;
        stakingTokenInstance.transfer(msg.sender, _amount);
    }

    // Calculate the user's earned rewards
    function calculateEarned(address _user) public view returns (uint) {
        return
            ((stakeBalance[_user] *
                (calculateRewardPerToken() - userAccumulatedReward[_user])) /
                1e18) + claimableRewards[_user];
    }

    // Claim rewards
    function claimRewards() external rewardUpdate(msg.sender) {
        uint reward = claimableRewards[msg.sender];
        if (reward > 0) {
            claimableRewards[msg.sender] = 0;
            rewardTokenInstance.transfer(msg.sender, reward);
        }
    }

    // Set the reward duration
    function setRewardDuration(uint _duration) external onlyContractOwner {
        require(
            rewardEndTime < block.timestamp,
            "Previous reward duration is not yet finished"
        );
        rewardDuration = _duration;
    }

    // Notify the contract about the reward distribution
    function notifyRewardDistribution(
        uint _reward
    ) external onlyContractOwner rewardUpdate(address(0)) {
        if (block.timestamp >= rewardEndTime) {
            rewardPerSec = _reward / rewardDuration;
        } else {
            uint remaining = (rewardEndTime - block.timestamp) * rewardPerSec;
            rewardPerSec = (_reward + remaining) / rewardDuration;
            require(rewardPerSec != 0, "Reward rate must be greater than 0");
            require(
                rewardPerSec * rewardDuration <=
                    rewardTokenInstance.balanceOf(address(this)),
                "Insufficient balance for reward distribution"
            );

            rewardEndTime = block.timestamp + rewardDuration;
            lastUpdated = block.timestamp;
        }
    }

    // Returns the smallest of two numbers
    function _min(uint x, uint y) private pure returns (uint) {
        return x <= y ? x : y;
    }
}
