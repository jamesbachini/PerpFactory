// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Perp {
    uint public price; // futures price
    uint public spot; // underlying spot price
    string public asset; // ticker symbol
    address public coin; // base asset, stablecoin
    mapping(address => bool) public oracles;
    uint public long; // total long value
    uint public short; // total short value
    uint public safuFund; // fees taken for liquidity cushion
    struct Position {
        uint value;
        uint openPrice;
        uint closePrice;
        bool long;
    }
    mapping(address => Position) public positions;
    Position[] public tradeHistory;
    event PlaceTrade(address trader, uint value, bool long);
    event CloseTrade(address trader, uint returnBalance);
    event Liquidation(address trader, address liquidator, uint value);
    
    constructor (string memory _asset, address _coin) {
        asset = _asset;
        coin = _coin;
        oracles[msg.sender] = true;
    }

    function placeTrade(uint _value, bool _long) external {
        require(positions[msg.sender].value == 0, "Close position first");
        require(_value > 0, "No value for trade provided");
        //IERC20(coin).transferFrom(msg.sender, address(this), _value);
        uint safuFee = calculateFee(_value, _long);
        safuFund += safuFee;
        uint remaining = _value - safuFee;
        if (_long == true) long += remaining;
        if (_long == false) short += remaining;
        positions[msg.sender] = Position(remaining, price, 0, _long);
        emit PlaceTrade(msg.sender, _value, _long);
    }

    function calculateFee(uint _value, bool _long) public view returns(uint) {
        uint fee = 0; // zero fees when taking other side
        if (long > short && _long == true) {
            uint slippage = _value * 10000 / short;
            fee = (short * 10000 / long) + slippage;
        }
        if (short > long && _long == false) {
            uint slippage = _value * 10000 / long;
            fee = (long * 10000 / short) + slippage;
        }
        uint safuFee = _value / fee;
        return safuFee;
    }

    function calculatePosition(address _user) public view returns(uint) {
        uint gain;
        uint loss;
        if (positions[_user].long == true) {
            if (price > positions[_user].openPrice)
                gain = price - positions[_user].openPrice;
            else loss = positions[_user].openPrice - price;
        }
        if (positions[_user].long == false) {
            if (price < positions[_user].openPrice)
                gain = positions[_user].openPrice - price;
            else loss = price - positions[_user].openPrice;
        }
        uint multiplier = positions[_user].value / positions[_user].openPrice;
        uint returnBalance = positions[_user].value;
        if (gain > 0) returnBalance = positions[_user].value + (gain * multiplier);
        if (loss > 0) returnBalance = positions[_user].value - (loss * multiplier);
        return returnBalance;
    }

    function closeTrade() external returns (uint) {
        require(positions[msg.sender].value > 0, "Open position first");
        uint returnBalance = calculatePosition(msg.sender);
        positions[msg.sender].closePrice = price;
        tradeHistory.push(positions[msg.sender]);
        if (positions[msg.sender].long == true) long -= positions[msg.sender].value;
        if (positions[msg.sender].long == false) short -= positions[msg.sender].value;
        delete positions[msg.sender];
        //if (returnBalance > 0) IERC20(coin).transfer(msg.sender, returnBalance);
        emit CloseTrade(msg.sender, returnBalance);
        return returnBalance;
    }

    function liquidatePosition(address _user) external returns(uint) {
        require(positions[_user].value > 0, "No one to liquidate");
        uint returnBalance = calculatePosition(_user);
        uint margin = returnBalance * 100 / positions[_user].value;
        require (margin < 3, "Margin requirement 3%");
        uint splitFee = returnBalance / 2;
        safuFund += splitFee;
        positions[_user].closePrice = price;
        tradeHistory.push(positions[_user]);
        if (positions[_user].long == true) long -= positions[_user].value;
        if (positions[_user].long == false) short -= positions[_user].value;
        delete positions[_user];
        //if (returnBalance > 0) IERC20(coin).transfer(msg.sender, splitFee);
        emit Liquidation(_user, msg.sender, splitFee);
        return splitFee;
    }

    function priceUpdate(uint _price) external {
        require(oracles[msg.sender] == true, "Oracles Only");
        price = spot = _price;
        if (long > short) price = spot + (long / short / 100 * spot);
        if (short > long) price = spot - (short / long / 100 * spot);
    }

    function updateOracle(address _oracleAddress, bool _isOracle) external {
        require(oracles[msg.sender] == true, "Oracles Only");
        oracles[_oracleAddress] = _isOracle;
    }
}