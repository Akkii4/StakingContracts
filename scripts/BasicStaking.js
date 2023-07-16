const hre = require("hardhat");

async function main() {
  const BasicStakingContract = await hre.ethers.getContractFactory(
    "BasicStaking"
  );
  const stakingTokenContract = await hre.ethers.getContractFactory("ERC20Mock");
  const stakingToken = await stakingTokenContract.deploy("StakingToken", "STK");

  const contract = await BasicStakingContract.deploy(stakingToken.address);
  await contract.deployed();
  console.log("BasicStakingContract deployed to:", contract.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
