// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./Token.sol";
import "./Perp.sol";

contract PerpFactory {
    address public perpUSD;
    address public perpGov;
    uint ethPrice = 2000;
    uint public perpCount;
    address[] public perps;

    event CreatePerp(address contractAddress, string ticker);
    event Deposit(address user, uint amount);
    event Withdraw(address user, uint amount);

    constructor() {
        perpUSD = address(new Token("PerpUSD", "Token"));
        perpGov = address(new Token("PerpGOV", "PGOV"));
        Token(perpGov).mint(msg.sender, 1_000_000 ether);
    }

    function deposit() external payable {
        uint amount = msg.value * ethPrice;
        emit Deposit(msg.sender, amount);
        Token(perpUSD).mint(msg.sender, amount);
    }

    function withdraw(uint _amount) external {
        require(Token(perpUSD).balanceOf(msg.sender) >= _amount, "Not enough funds to withdraw");
        Token(perpUSD).burn(msg.sender, _amount);
        uint ethReturned = _amount / ethPrice;
        emit Withdraw(msg.sender, ethReturned);
        payable(msg.sender).transfer(ethReturned);
    }

    function createPerp(string memory _asset, uint _leverage) external returns (address) {
        perpCount += 1;
        address newPerp = address(new Perp(_asset, _leverage, perpUSD, msg.sender));
        perps.push(newPerp);
        emit CreatePerp(newPerp, _asset);
        return newPerp;
    }

    /* Send users who get liquidated gov tokens :) */
    function liquidated(address _trader, uint _feeAmount) external {
        Token(perpGov).mint(_trader, _feeAmount);
        // Send pusd fees to gov token holders?
    }
}