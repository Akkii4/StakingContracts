const { ethers } = require("hardhat");

async function main() {
  const stakingTokenAddress = ""; // Insert the address of the token being staked
  const rewardTokenAddress = ""; // Insert the address of the token used for rewards

  const ComplexRewardStaking = await ethers.getContractFactory(
    "ComplexRewardStaking"
  );
  const complexRewardStaking = await ComplexRewardStaking.deploy(
    stakingTokenAddress,
    rewardTokenAddress
  );

  console.log("Contract address:", complexRewardStaking.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
