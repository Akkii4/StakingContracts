const { expect } = require("chai");

describe("BasicStaking", function () {
  let stakingToken;
  let basicStaking;
  let owner;
  let alice;
  let bob;

  const STAKING_TOKEN_INITIAL_SUPPLY = ethers.utils.parseEther("1000");

  beforeEach(async function () {
    // Deploy the mock ERC20 token contract as staking token
    const ERC20Mock = await ethers.getContractFactory("ERC20Mock");
    stakingToken = await ERC20Mock.deploy(
      "Staking Token",
      "STK",
      STAKING_TOKEN_INITIAL_SUPPLY
    );
    await stakingToken.deployed();

    // Deploy the BasicStaking contract with the mock ERC20 token
    const BasicStaking = await ethers.getContractFactory("BasicStaking");
    basicStaking = await BasicStaking.deploy(stakingToken.address);
    await basicStaking.deployed();

    // Get the accounts
    [owner, alice, bob] = await ethers.getSigners();
  });

  describe("Deployment", function () {
    it("Should set the staking token correctly", async function () {
      expect(await basicStaking.stakingToken()).to.equal(stakingToken.address);
    });

    it("Should set the initial xToken supply to zero", async function () {
      expect(await basicStaking.totalSupply()).to.equal(0);
    });
  });

  describe("Staking", function () {
    it("Should allow users to enter the staking pool", async function () {
      const stakingAmount = ethers.utils.parseEther("10");

      await stakingToken
        .connect(alice)
        .approve(basicStaking.address, stakingAmount);
      await basicStaking.connect(alice).enter(stakingAmount);

      expect(await basicStaking.balanceOf(alice.address)).to.equal(
        stakingAmount
      );
      expect(await stakingToken.balanceOf(basicStaking.address)).to.equal(
        stakingAmount
      );
    });

    it("Should mint new xTokens to the staker if there are no xTokens issued or no staking tokens in the contract", async function () {
      const stakingAmount = ethers.utils.parseEther("10");

      await stakingToken
        .connect(alice)
        .approve(basicStaking.address, stakingAmount);
      await basicStaking.connect(alice).enter(stakingAmount);

      expect(await basicStaking.totalSupply()).to.equal(stakingAmount);
    });

    it("Should calculate the number of xTokens to issue based on the ratio of staking tokens to xTokens", async function () {
      const aliceStakingAmount = ethers.utils.parseEther("10");
      const bobStakingAmount = ethers.utils.parseEther("20");

      await stakingToken
        .connect(alice)
        .approve(basicStaking.address, aliceStakingAmount);
      await stakingToken
        .connect(bob)
        .approve(basicStaking.address, bobStakingAmount);

      await basicStaking.connect(alice).enter(aliceStakingAmount);
      await basicStaking.connect(bob).enter(bobStakingAmount);

      const totalStakingToken = await stakingToken.balanceOf(
        basicStaking.address
      );
      const aliceShares = await basicStaking.balanceOf(alice.address);
      const bobShares = await basicStaking.balanceOf(bob.address);

      const proportionalAmountAlice = aliceStakingAmount
        .mul(totalStakingToken)
        .div(aliceStakingAmount.add(bobStakingAmount));
      const proportionalAmountBob = bobStakingAmount
        .mul(totalStakingToken)
        .div(aliceStakingAmount.add(bobStakingAmount));

      expect(aliceShares).to.equal(proportionalAmountAlice);
      expect(bobShares).to.equal(proportionalAmountBob);
    });

    it("Should not allow users to enter the staking pool with zero staking amount", async function () {
      await expect(basicStaking.connect(alice).enter(0)).to.be.revertedWith(
        "ERC20: transfer amount exceeds balance"
      );
    });

    it("Should not allow users to enter the staking pool with insufficient staking tokens", async function () {
      const stakingAmount = ethers.utils.parseEther("10");

      await expect(
        basicStaking.connect(alice).enter(stakingAmount)
      ).to.be.revertedWith("ERC20: transfer amount exceeds balance");

      await stakingToken.connect(owner).transfer(alice.address, stakingAmount);
      await stakingToken
        .connect(alice)
        .approve(basicStaking.address, stakingAmount.div(2));

      await expect(
        basicStaking.connect(alice).enter(stakingAmount)
      ).to.be.revertedWith("Transfer of Staking Token failed");
    });
  });

  describe("Unstaking", function () {
    it("Should allow users to leave the staking pool", async function () {
      const stakingAmount = ethers.utils.parseEther("10");

      await stakingToken
        .connect(alice)
        .approve(basicStaking.address, stakingAmount);
      await basicStaking.connect(alice).enter(stakingAmount);

      const xTokenAmount = await basicStaking.balanceOf(alice.address);

      await basicStaking.connect(alice).leave(xTokenAmount);

      expect(await basicStaking.balanceOf(alice.address)).to.equal(0);
      expect(await stakingToken.balanceOf(alice.address)).to.equal(
        stakingAmount
      );
    });

    it("Should burn xTokens from the staker's account", async function () {
      const stakingAmount = ethers.utils.parseEther("10");

      await stakingToken
        .connect(alice)
        .approve(basicStaking.address, stakingAmount);
      await basicStaking.connect(alice).enter(stakingAmount);

      const xTokenAmount = await basicStaking.balanceOf(alice.address);

      await basicStaking.connect(alice).leave(xTokenAmount.div(2));

      expect(await basicStaking.balanceOf(alice.address)).to.equal(
        xTokenAmount.div(2)
      );
    });

    it("Should not allow users to leave the staking pool with zero xToken amount", async function () {
      await expect(basicStaking.connect(alice).leave(0)).to.be.revertedWith(
        "ERC20: burn amount exceeds balance"
      );
    });

    it("Should not allow users to leave the staking pool with insufficient xTokens", async function () {
      const stakingAmount = ethers.utils.parseEther("10");

      await stakingToken
        .connect(alice)
        .approve(basicStaking.address, stakingAmount);
      await basicStaking.connect(alice).enter(stakingAmount);

      const xTokenAmount = await basicStaking.balanceOf(alice.address);

      await expect(
        basicStaking.connect(alice).leave(xTokenAmount.add(1))
      ).to.be.revertedWith("ERC20: burn amount exceeds balance");
    });
  });
});
