const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PeriodicRewardStaking", function () {
  let accounts;
  let stakingToken, rewardToken, contract;

  const STAKING_TOKEN_SUPPLY = ethers.utils.parseEther("1000000");
  const REWARD_TOKEN_SUPPLY = ethers.utils.parseEther("1000000");
  const STAKE_AMOUNT = ethers.utils.parseEther("1000");
  const REWARD_AMOUNT = ethers.utils.parseEther("1000");

  beforeEach(async function () {
    accounts = await ethers.getSigners();

    // Deploy the tokens and mint the initial supply to the deployer
    const StakingToken = await ethers.getContractFactory("StakingToken");
    stakingToken = await StakingToken.deploy(STAKING_TOKEN_SUPPLY);
    await stakingToken.transfer(accounts[1].address, STAKE_AMOUNT);

    const RewardToken = await ethers.getContractFactory("RewardToken");
    rewardToken = await RewardToken.deploy(REWARD_TOKEN_SUPPLY);
    await rewardToken.transfer(accounts[1].address, REWARD_AMOUNT);

    // Deploy the contract
    const PeriodicRewardStaking = await ethers.getContractFactory(
      "PeriodicRewardStaking"
    );
    contract = await PeriodicRewardStaking.deploy(
      stakingToken.address,
      rewardToken.address
    );

    // Approve the contract to spend the staking token on behalf of the user
    await stakingToken
      .connect(accounts[1])
      .approve(contract.address, STAKE_AMOUNT);
  });

  describe("Staking", function () {
    it("should stake tokens and update user's balance and total staked", async function () {
      await contract.connect(accounts[1]).stakeTokens(STAKE_AMOUNT);
      expect(await contract.totalStaked()).to.equal(STAKE_AMOUNT);
      expect(await contract.userBalance(accounts[1].address)).to.equal(
        STAKE_AMOUNT
      );
    });

    it("should fail to stake tokens if the user does not have enough balance", async function () {
      await expect(
        contract.connect(accounts[2]).stakeTokens(STAKE_AMOUNT)
      ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
    });
  });

  describe("Unstaking", function () {
    beforeEach(async function () {
      await contract.connect(accounts[1]).stakeTokens(STAKE_AMOUNT);
    });

    it("should unstake tokens and update user's balance and total staked", async function () {
      await contract.connect(accounts[1]).unstakeTokens(STAKE_AMOUNT);
      expect(await contract.totalStaked()).to.equal(0);
      expect(await contract.userBalance(accounts[1].address)).to.equal(0);
    });

    it("should fail to unstake tokens if the user does not have enough balance", async function () {
      await expect(
        contract.connect(accounts[2]).unstakeTokens(STAKE_AMOUNT)
      ).to.be.revertedWith("SafeMath: subtraction overflow");
    });
  });

  describe("Reward Claiming", function () {
    beforeEach(async function () {
      await contract.connect(accounts[1]).stakeTokens(STAKE_AMOUNT);
      await contract.adjustRewardIndex(REWARD_AMOUNT);
    });

    it("should claim rewards and update user's balance", async function () {
      const earnedRewards = await contract.calculateEarnedRewards(
        accounts[1].address
      );
      await contract.connect(accounts[1]).claimReward();
      expect(await rewardToken.balanceOf(accounts[1].address)).to.equal(
        earnedRewards
      );
      expect(await contract.userEarned(accounts[1].address)).to.equal(0);
    });
  });

  describe("Reward Adjustment", function () {
    it("should adjust reward index and update current reward index", async function () {
      await contract.adjustRewardIndex(REWARD_AMOUNT);
      expect(await contract.currentRewardIndex()).to.equal(
        REWARD_AMOUNT.mul(ethers.utils.parseEther("1")).div(STAKE_AMOUNT)
      );
    });

    it("should fail to adjust reward index if the caller does not have enough balance", async function () {
      await expect(
        contract.connect(accounts[2]).adjustRewardIndex(REWARD_AMOUNT)
      ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
    });

    describe("Reward Calculation", function () {
      beforeEach(async function () {
        await contract.adjustRewardIndex(REWARD_AMOUNT);
        await contract.connect(accounts[1]).stakeTokens(STAKE_AMOUNT);
      });

      it("should calculate earned rewards for a user", async function () {
        const earnedRewards = await contract.calculateEarnedRewards(
          accounts[1].address
        );
        expect(earnedRewards).to.equal(
          REWARD_AMOUNT.mul(STAKE_AMOUNT).div(ethers.utils.parseEther("1"))
        );
      });

      it("should compute earned rewards for a user", async function () {
        const earnedRewards = await contract.computeRewards(
          accounts[1].address
        );
        expect(earnedRewards).to.equal(
          REWARD_AMOUNT.mul(STAKE_AMOUNT).div(ethers.utils.parseEther("1"))
        );
      });

      it("should recalculate rewards for a user", async function () {
        const earnedRewardsBefore = await contract.calculateEarnedRewards(
          accounts[1].address
        );
        await contract.adjustRewardIndex(REWARD_AMOUNT);
        const earnedRewardsAfter = await contract.calculateEarnedRewards(
          accounts[1].address
        );
        expect(earnedRewardsAfter).to.equal(
          earnedRewardsBefore.add(
            REWARD_AMOUNT.mul(STAKE_AMOUNT).div(ethers.utils.parseEther("1"))
          )
        );
      });
    });
  });
});
