// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract VotingNFT is ERC721, Ownable {
    uint256 private _nextTokenId;
    mapping(address => bool) public hasMembership;
    
    // Добавляем mapping для минтеров
    mapping(address => bool) public minters;

    constructor() ERC721("Voting Membership", "VOTEMEMBER") Ownable(msg.sender) {}

    // Модифицируем функцию чтобы разрешить минт минтерам
    function safeMint(address to) external {
        require(minters[msg.sender] || owner() == msg.sender, "Not minter or owner");
        require(!hasMembership[to], "Already has membership");
        
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        hasMembership[to] = true;
    }

    function revokeMembership(address member) external onlyOwner {
        require(hasMembership[member], "No membership found");
        hasMembership[member] = false;
    }

    // Функции для управления минтерами
    function addMinter(address minter) external onlyOwner {
        minters[minter] = true;
    }

    function removeMinter(address minter) external onlyOwner {
        minters[minter] = false;
    }
}