const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ComplexRewardStaking", function () {
  let stakingToken;
  let rewardToken;
  let complexRewardStaking;
  let owner;
  let user1;
  let user2;

  const REWARD_DURATION = 60 * 60 * 24; // 24 hours

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    const StakingToken = await ethers.getContractFactory("StakingToken");
    stakingToken = await StakingToken.deploy("Staking Token", "STK");
    await stakingToken.mint(owner.address, ethers.utils.parseEther("1000"));

    const RewardToken = await ethers.getContractFactory("RewardToken");
    rewardToken = await RewardToken.deploy("Reward Token", "REWARD");
    await rewardToken.mint(owner.address, ethers.utils.parseEther("1000"));

    const ComplexRewardStaking = await ethers.getContractFactory(
      "ComplexRewardStaking"
    );
    complexRewardStaking = await ComplexRewardStaking.deploy(
      stakingToken.address,
      rewardToken.address
    );

    await stakingToken
      .connect(owner)
      .approve(complexRewardStaking.address, ethers.utils.parseEther("1000"));

    await complexRewardStaking
      .connect(owner)
      .notifyRewardDistribution(ethers.utils.parseEther("1000"));
    await ethers.provider.send("evm_increaseTime", [REWARD_DURATION]);
    await ethers.provider.send("evm_mine");
  });

  describe("constructor", function () {
    it("should set the correct staking token", async function () {
      expect(await complexRewardStaking.stakingTokenInstance()).to.equal(
        stakingToken.address
      );
    });

    it("should set the correct reward token", async function () {
      expect(await complexRewardStaking.rewardTokenInstance()).to.equal(
        rewardToken.address
      );
    });

    it("should set the correct contract owner", async function () {
      expect(await complexRewardStaking.contractOwner()).to.equal(
        owner.address
      );
    });
  });

  describe("stakeTokens", function () {
    it("should allow users to stake tokens", async function () {
      await complexRewardStaking
        .connect(user1)
        .stakeTokens(ethers.utils.parseEther("100"));
      expect(await complexRewardStaking.stakedSupply()).to.equal(
        ethers.utils.parseEther("100")
      );
      expect(await complexRewardStaking.stakeBalance(user1.address)).to.equal(
        ethers.utils.parseEther("100")
      );
    });

    it("should not allow users to stake 0 tokens", async function () {
      await expect(
        complexRewardStaking.connect(user1).stakeTokens(0)
      ).to.be.revertedWith("Amount must be greater than 0");
    });
  });

  describe("withdrawTokens", function () {
    beforeEach(async function () {
      await complexRewardStaking
        .connect(user1)
        .stakeTokens(ethers.utils.parseEther("100"));
    });

    it("should allow users to withdraw tokens", async function () {
      await complexRewardStaking
        .connect(user1)
        .withdrawTokens(ethers.utils.parseEther("50"));
      expect(await complexRewardStaking.stakedSupply()).to.equal(
        ethers.utils.parseEther("50")
      );
      expect(await complexRewardStaking.stakeBalance(user1.address)).to.equal(
        ethers.utils.parseEther("50")
      );
    });

    it("should not allow users to withdraw 0 tokens", async function () {
      await expect(
        complexRewardStaking.connect(user1).withdrawTokens(0)
      ).to.be.revertedWith("Amount must be greater than 0");
    });

    it("should not allow users to withdraw more tokens than they have staked", async function () {
      await expect(
        complexRewardStaking
          .connect(user1)
          .withdrawTokens(ethers.utils.parseEther("200"))
      ).to.be.revertedWith("Insufficient balance");
    });
  });

  describe("calculateEarned", function () {
    beforeEach(async function () {
      await complexRewardStaking
        .connect(user1)
        .stakeTokens(ethers.utils.parseEther("100"));
    });

    it("should calculate the correct earned rewards", async function () {
      await ethers.provider.send("evm_increaseTime", [REWARD_DURATION / 2]);
      await ethers.provider.send("evm_mine");

      const earned1 = await complexRewardStaking.calculateEarned(user1.address);
      expect(earned1).to.be.closeTo(
        ethers.utils.parseEther("50"),
        ethers.utils.parseEther("0.0001")
      );

      await ethers.provider.send("evm_increaseTime", [REWARD_DURATION / 2]);
      await ethers.provider.send("evm_mine");

      const earned2 = await complexRewardStaking.calculateEarned(user1.address);
      expect(earned2).to.be.closeTo(
        ethers.utils.parseEther("100"),
        ethers.utils.parseEther("0.0001")
      );
    });
  });

  describe("claimRewards", function () {
    beforeEach(async function () {
      await complexRewardStaking
        .connect(user1)
        .stakeTokens(ethers.utils.parseEther("100"));
    });

    it("should allow users to claim their rewards", async function () {
      await ethers.provider.send("evm_increaseTime", [REWARD_DURATION]);
      await ethers.provider.send("evm_mine");

      const earned = await complexRewardStaking.calculateEarned(user1.address);
      await complexRewardStaking.connect(user1).claimRewards();

      expect(await rewardToken.balanceOf(user1.address)).to.equal(earned);
    });

    it("should not allow users to claim 0 rewards", async function () {
      await expect(
        complexRewardStaking.connect(user1).claimRewards()
      ).to.be.revertedWith("No rewards to claim");
    });
  });

  describe("notifyRewardDistribution", function () {
    it("should allow the owner to distribute rewards", async function () {
      await complexRewardStaking
        .connect(owner)
        .notifyRewardDistribution(ethers.utils.parseEther("1000"));

      expect(await complexRewardStaking.rewardPerSec()).to.equal(
        ethers.utils.parseEther("1000").div(REWARD_DURATION)
      );
      expect(await complexRewardStaking.rewardEndTime()).to.equal(
        REWARD_DURATION
      );
      expect(await complexRewardStaking.lastUpdated()).to.equal(0);
    });

    it("should update the reward rate if a previous reward period is still ongoing", async function () {
      await complexRewardStaking
        .connect(owner)
        .notifyRewardDistribution(ethers.utils.parseEther("1000"));
      await complexRewardStaking
        .connect(owner)
        .notifyRewardDistribution(ethers.utils.parseEther("2000"));

      expect(await complexRewardStaking.rewardPerSec()).to.equal(
        ethers.utils.parseEther("3000").div(REWARD_DURATION)
      );
      expect(await complexRewardStaking.rewardEndTime()).to.equal(
        REWARD_DURATION * 2
      );
      expect(await complexRewardStaking.lastUpdated()).to.equal(0);
    });

    it("should not allow the owner to distribute rewards if the contract has insufficient balance", async function () {
      await rewardToken.transfer(user1.address, ethers.utils.parseEther("500"));
      await rewardToken
        .connect(user1)
        .approve(complexRewardStaking.address, ethers.utils.parseEther("500"));

      await expect(
        complexRewardStaking
          .connect(owner)
          .notifyRewardDistribution(ethers.utils.parseEther("1000"))
      ).to.be.revertedWith("Insufficient balance");
    });

    it("should not allow non-owners to distribute rewards", async function () {
      await expect(
        complexRewardStaking
          .connect(user1)
          .notifyRewardDistribution(ethers.utils.parseEther("1000"))
      ).to.be.revertedWith("Unauthorized access");
    });
  });
});
