import { ethers } from "hardhat";

async function main() {
  // Получаем контракты
  const VotingDAO = await ethers.getContractFactory("VotingDAO");
  const VotingNFT = await ethers.getContractFactory("VotingNFT");
  
  // Предполагаем, что контракты уже развернуты
  // Замените на реальные адреса после деплоя
  const VOTING_DAO_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Локальный хардхат адрес
  const VOTING_NFT_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"; // Локальный хардхат адрес

  const votingDAO = VotingDAO.attach(VOTING_DAO_ADDRESS);
  const votingNFT = VotingNFT.attach(VOTING_NFT_ADDRESS);

  const [_, member1] = await ethers.getSigners();

  console.log("Creating a proposal...");

  // Даем NFT членство (в реальном сценарии это делалось бы через голосование)
  console.log("Granting membership to:", member1.address);
  await votingNFT.safeMint(member1.address);

  // Создаем предложение от имени member1
  console.log("Creating proposal...");
  await votingDAO.connect(member1).createProposal("Should we build a new feature?");

  console.log("Proposal created successfully!");
  console.log("Proposal ID: 1");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
