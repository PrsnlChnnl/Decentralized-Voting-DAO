import { expect } from "chai";
import { ethers } from "hardhat";
import { Signer } from "ethers";

describe("VotingDAO", function () {
  let governanceToken: any;
  let votingNFT: any;
  let treasury: any;
  let votingDAO: any;
  let owner: Signer;
  let addr1: Signer;
  let addr2: Signer;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    // Деплой GovernanceToken
    const GovernanceToken = await ethers.getContractFactory("GovernanceToken");
    governanceToken = await GovernanceToken.deploy();
    await governanceToken.waitForDeployment();
    
    // Деплой VotingNFT
    const VotingNFT = await ethers.getContractFactory("VotingNFT");
    votingNFT = await VotingNFT.deploy();
    await votingNFT.waitForDeployment();
    
    // Деплой Treasury
    const Treasury = await ethers.getContractFactory("Treasury");
    treasury = await Treasury.deploy();
    await treasury.waitForDeployment();
    
    // Деплой VotingDAO
    const VotingDAO = await ethers.getContractFactory("VotingDAO");
    votingDAO = await VotingDAO.deploy(
      await governanceToken.getAddress(),
      await votingNFT.getAddress(),
      await treasury.getAddress()
    );
    await votingDAO.waitForDeployment();

    /// Настройка прав
    await governanceToken.connect(owner).addMinter(await votingDAO.getAddress());
    await governanceToken.connect(owner).addMinter(await owner.getAddress()); // ← ДОБАВЬТЕ ЭТУ СТРОКУ
    await votingNFT.connect(owner).addMinter(await owner.getAddress());
    await votingNFT.connect(owner).transferOwnership(await votingDAO.getAddress());
    await treasury.connect(owner).transferOwnership(await votingDAO.getAddress());
});

  describe("DAO Functionality", function () {
    it("Should create a proposal", async function () {
      // Даем NFT членство - через votingNFT так как votingDAO еще не имеет функционала addMember
      await votingNFT.connect(owner).safeMint(await addr1.getAddress());
      
      // Создаем предложение
      await expect(votingDAO.connect(addr1).createProposal("Test Proposal"))
        .to.emit(votingDAO, "ProposalCreated");
    });

    it("Should vote on proposal", async function () {
      // Настройка
      await votingNFT.connect(owner).safeMint(await addr1.getAddress());
      await votingDAO.connect(addr1).createProposal("Test Proposal");
      
      // Минтим токены для голосования
      await governanceToken.connect(owner).mint(await addr2.getAddress(), ethers.parseEther("1000"));
      
      // Голосуем
      await expect(votingDAO.connect(addr2).vote(1, true))
        .to.emit(votingDAO, "VoteCast");
    });

    it("Should execute successful proposal", async function () {
      // Настройка
      await votingNFT.connect(owner).safeMint(await addr1.getAddress());
      await votingDAO.connect(addr1).createProposal("Test Proposal");
      
      // Минтим токены и голосуем
      await governanceToken.connect(owner).mint(await addr2.getAddress(), ethers.parseEther("1500"));
      await votingDAO.connect(addr2).vote(1, true);
      
      // Ждем окончания голосования
      await ethers.provider.send("evm_increaseTime", [2 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine", []);
      
      // Выполняем предложение
      await expect(votingDAO.executeProposal(1))
        .to.emit(votingDAO, "ProposalExecuted");
    });

    it("Should fail without quorum", async function () {
      await votingNFT.connect(owner).safeMint(await addr1.getAddress());
      await votingDAO.connect(addr1).createProposal("Test Proposal");
      
      await ethers.provider.send("evm_increaseTime", [2 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine", []);
      
      await expect(votingDAO.executeProposal(1))
        .to.be.revertedWith("Quorum not reached");
    });
  });
});