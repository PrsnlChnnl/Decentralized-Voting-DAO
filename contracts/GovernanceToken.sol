// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract GovernanceToken is ERC20, Ownable {
    mapping(address => bool) public minters;

    modifier onlyMinter() {
        require(minters[msg.sender], "Only minter can call this");
        _;
    }

    constructor() ERC20("Governance Token", "GT") Ownable(msg.sender) {}

    function addMinter(address _minter) external onlyOwner {
        minters[_minter] = true;
    }

    function mint(address to, uint256 amount) external onlyMinter {
        _mint(to, amount);
    }

    function getVotes(address account) external view returns (uint256) {
        return balanceOf(account);
    }
}