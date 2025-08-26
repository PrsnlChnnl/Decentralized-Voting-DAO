// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./GovernanceToken.sol";
import "./VotingNFT.sol";
import "./Treasury.sol";

contract VotingDAO is Ownable {
    struct Proposal {
        uint256 id;
        string description;
        uint256 deadline;
        uint256 yesVotes;
        uint256 noVotes;
        bool executed;
        address proposer;
    }

    GovernanceToken public governanceToken;
    VotingNFT public votingNFT;
    Treasury public treasury;

    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    uint256 public proposalCount;
    uint256 public constant VOTING_DELAY = 2 days;
    uint256 public constant QUORUM = 1000 * 10**18; // 1000 tokens

    event ProposalCreated(uint256 indexed proposalId, address indexed proposer);
    event VoteCast(uint256 indexed proposalId, address indexed voter, bool support);
    event ProposalExecuted(uint256 indexed proposalId);
    event MemberAdded(address indexed member);

    modifier onlyMember() {
        require(votingNFT.hasMembership(msg.sender), "Not a DAO member");
        _;
    }

    constructor(address _governanceToken, address _votingNFT, address payable _treasury) 
        Ownable(msg.sender) 
    {
        governanceToken = GovernanceToken(_governanceToken);
        votingNFT = VotingNFT(_votingNFT);
        treasury = Treasury(payable(_treasury));
    }

    // Добавляем функцию для добавления членов (только owner)
    function addMember(address _member) external onlyOwner {
        votingNFT.safeMint(_member);
        emit MemberAdded(_member);
    }

    function createProposal(string memory _description) external onlyMember {
        proposalCount++;
        proposals[proposalCount] = Proposal({
            id: proposalCount,
            description: _description,
            deadline: block.timestamp + VOTING_DELAY,
            yesVotes: 0,
            noVotes: 0,
            executed: false,
            proposer: msg.sender
        });

        emit ProposalCreated(proposalCount, msg.sender);
    }

    function vote(uint256 _proposalId, bool _support) external {
        Proposal storage proposal = proposals[_proposalId];
        require(block.timestamp <= proposal.deadline, "Voting ended");
        require(!hasVoted[_proposalId][msg.sender], "Already voted");

        uint256 votingPower = governanceToken.getVotes(msg.sender);
        require(votingPower > 0, "No voting power");

        if (_support) {
            proposal.yesVotes += votingPower;
        } else {
            proposal.noVotes += votingPower;
        }

        hasVoted[_proposalId][msg.sender] = true;
        emit VoteCast(_proposalId, msg.sender, _support);
    }

    function executeProposal(uint256 _proposalId) external {
        Proposal storage proposal = proposals[_proposalId];
        require(block.timestamp > proposal.deadline, "Voting not ended");
        require(!proposal.executed, "Already executed");
        require(proposal.yesVotes + proposal.noVotes >= QUORUM, "Quorum not reached");
        require(proposal.yesVotes > proposal.noVotes, "Proposal failed");

        proposal.executed = true;
        
        emit ProposalExecuted(_proposalId);
    }

    function getProposal(uint256 _proposalId) external view returns (Proposal memory) {
        return proposals[_proposalId];
    }
}