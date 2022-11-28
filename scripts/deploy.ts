import { ethers } from "hardhat";

async function main() {
  const Disperse = await ethers.getContractFactory("Disperse");
  const disperse = await Disperse.deploy();

  await disperse.deployed();

  console.log(`Disperse deployed to ${disperse.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
