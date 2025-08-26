// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Treasury is Ownable {
    event FundsReceived(address from, uint256 amount);
    event FundsSent(address to, uint256 amount);

    constructor() Ownable(msg.sender) {}

    receive() external payable {
        emit FundsReceived(msg.sender, msg.value);
    }

    function sendFunds(address payable to, uint256 amount) external onlyOwner {
        require(address(this).balance >= amount, "Insufficient balance");
        to.transfer(amount);
        emit FundsSent(to, amount);
    }

    function sendERC20(
        IERC20 token,
        address to,
        uint256 amount
    ) external onlyOwner {
        require(token.balanceOf(address(this)) >= amount, "Insufficient token balance");
        token.transfer(to, amount);
        emit FundsSent(to, amount);
    }

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
}