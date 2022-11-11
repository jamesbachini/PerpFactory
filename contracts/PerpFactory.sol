// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./Perp.sol";

contract Token is ERC20 {
    address owner;
    constructor(string memory _name, string memory _ticker) ERC20(_name, _ticker) {
        owner = msg.sender;
    }
    function mint(address _to, uint _value) external {
        _mint(_to, _value);
    }
    function burn(address _from, uint _value) external {
        _burn(_from, _value);
    }
}

contract PerpFactory {
    address public pUSD;
    uint ethPrice = 2000;
    constructor() {
        Token PerpUSD = new Token("PerpUSD", "PUSD");
        pUSD = address(PerpUSD);
    }

    function deposit() external payable {
        uint amount = msg.value * ethPrice;
        Token(pUSD).mint(msg.sender, amount);
    }

    function withdraw(uint _amount) external {
        require(Token(pUSD).balanceOf(msg.sender) >= _amount, "Not enough funds to withdraw");
        Token(pUSD).burn(msg.sender, _amount);
        uint ethReturned = _amount / ethPrice;
        payable(msg.sender).transfer(ethReturned);
    }

    function createPerp(string memory _asset) external returns (address) {
        Perp newPerp = new Perp(_asset, pUSD);
        return address(newPerp);
    }
}