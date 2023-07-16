const { ethers } = require("hardhat");

async function main() {
  // Deploy the contract and get its instance
  const PeriodicRewardStaking = await ethers.getContractFactory(
    "PeriodicRewardStaking"
  );
  const stakingTokenAddress = "STAKING_TOKEN_ADDRESS_HERE";
  const rewardTokenAddress = "REWARD_TOKEN_ADDRESS_HERE";
  const contract = await PeriodicRewardStaking.deploy(
    stakingTokenAddress,
    rewardTokenAddress
  );

  console.log("Contract deployed to address:", contract.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
