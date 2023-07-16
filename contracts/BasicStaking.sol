// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// This is a basic staking contract that allows users to stake there StakingTokens and receive xTokens in return
contract BasicStaking is ERC20("BasicToken", "xToken") {
    // Declare a public variable for the staking token
    IERC20 public stakingToken;

    // Constructor to set the staking token
    constructor(IERC20 _stakingToken) {
        stakingToken = _stakingToken;
    }

    // Function to enter the staking pool
    function enter(uint256 _stakingAmount) external {
        // Calculate the total staking tokens in the contract and the total number of xTokens issued
        uint256 totalStakingToken = stakingToken.balanceOf(address(this));
        uint256 totalShares = totalSupply();

        // If there are no xTokens issued or no staking tokens in the contract, mint new xTokens to the staker
        if (totalShares == 0 || totalStakingToken == 0) {
            _mint(msg.sender, _stakingAmount);
        }
        // Otherwise, calculate the number of xTokens to issue based on the ratio of staking tokens to xTokens
        else {
            uint256 proportionalAmount = ((_stakingAmount * totalShares) /
                totalStakingToken);
            _mint(msg.sender, proportionalAmount);
        }

        // Transfer the staking tokens from the staker to the contract
        require(
            stakingToken.transferFrom(
                msg.sender,
                address(this),
                _stakingAmount
            ),
            "Transfer of Staking Token failed"
        );
    }

    // Function to leave the staking pool
    function leave(uint256 _xTokenAmount) external {
        // Calculate the total number of xTokens issued and the amount of staking tokens to return to the staker
        uint256 totalShares = totalSupply();
        uint256 proportionalAmount = ((_xTokenAmount *
            stakingToken.balanceOf(address(this))) / totalShares);

        // Burn the xTokens from the staker's account
        _burn(msg.sender, _xTokenAmount);

        // Transfer the staking tokens from the contract to the staker
        require(
            stakingToken.transfer(msg.sender, proportionalAmount),
            "Transfer of Staking Token failed"
        );
    }
}
