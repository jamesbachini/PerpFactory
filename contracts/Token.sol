// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Token is ERC20 {
    address owner;
    constructor(string memory _name, string memory _ticker) ERC20(_name, _ticker) {
        owner = msg.sender;
    }
    function mint(address _to, uint _value) external {
        require(msg.sender == owner, "Only parent contract can mint");
        _mint(_to, _value);
    }
    function burn(address _from, uint _value) external {
        require(msg.sender == owner, "Only parent contract can burn");
        _burn(_from, _value);
    }
}