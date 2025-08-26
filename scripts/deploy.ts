import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());
  
  // Деплой GovernanceToken
  const GovernanceToken = await ethers.getContractFactory("GovernanceToken");
  const governanceToken = await GovernanceToken.deploy();
  await governanceToken.waitForDeployment();
  console.log("GovernanceToken deployed to:", await governanceToken.getAddress());

  // Деплой VotingNFT
  const VotingNFT = await ethers.getContractFactory("VotingNFT");
  const votingNFT = await VotingNFT.deploy();
  await votingNFT.waitForDeployment();
  console.log("VotingNFT deployed to:", await votingNFT.getAddress());

  // Деплой Treasury
  const Treasury = await ethers.getContractFactory("Treasury");
  const treasury = await Treasury.deploy();
  await treasury.waitForDeployment();
  console.log("Treasury deployed to:", await treasury.getAddress());

  // Деплой VotingDAO
  const VotingDAO = await ethers.getContractFactory("VotingDAO");
  const votingDAO = await VotingDAO.deploy(
    await governanceToken.getAddress(),
    await votingNFT.getAddress(),
    await treasury.getAddress()
  );
  await votingDAO.waitForDeployment();
  console.log("VotingDAO deployed to:", await votingDAO.getAddress());

  // Настройка прав
  console.log("Setting up permissions...");
  
  // 1. Даем VotingDAO право минта GovernanceToken
  await governanceToken.addMinter(await votingDAO.getAddress());
  
  // 2. Делаем VotingDAO минтером в VotingNFT (ВАЖНО!)
  await votingNFT.addMinter(await votingDAO.getAddress());
  
  // 3. Передаем ownership Treasury VotingDAO
  await treasury.transferOwnership(await votingDAO.getAddress());
  
  // 4. Передаем ownership VotingNFT VotingDAO (если нужно)
  await votingNFT.transferOwnership(await votingDAO.getAddress());

  console.log("Setup completed successfully!");
  
  console.log("\nContract addresses:");
  console.log("GovernanceToken:", await governanceToken.getAddress());
  console.log("VotingNFT:", await votingNFT.getAddress());
  console.log("Treasury:", await treasury.getAddress());
  console.log("VotingDAO:", await votingDAO.getAddress());
  
  return {
    governanceToken: await governanceToken.getAddress(),
    votingNFT: await votingNFT.getAddress(),
    treasury: await treasury.getAddress(),
    votingDAO: await votingDAO.getAddress()
  };
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});