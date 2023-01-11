// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract BUIDLBUXX is ERC20, Ownable {

    mapping(address => bool) public allowList;
    event TransferedWithMessage(address indexed from, address indexed to, uint256 value, string message);

    modifier onlyAllowListedOrOwner() {
        require(allowList[msg.sender] || owner() == _msgSender(), "Not allowlisted or owner");
        _;
    }

    constructor() ERC20("BUIDL BUXX", "BUIDL") {
        _mint(msg.sender, 100000 * 10 ** decimals());
    }

    function decimals() public view virtual override returns (uint8) {
        return 2;
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    function burn(address account, uint256 amount) public virtual onlyOwner {
        _burn(account, amount);
    }

    function transferWithMessage(address to, uint256 amount, string memory message) public returns (bool) {
        bool success = transfer(to, amount);
        emit TransferedWithMessage(msg.sender, to, amount, message);
        return success;
    }

    function forceTransferWithMessage(address owner, address to, uint256 amount, string memory message) public onlyAllowListedOrOwner returns (bool) {
        _transfer(owner, to, amount);
        emit TransferedWithMessage(owner, to, amount, message);
        return true;
    }

    function addToAllowList(address[] memory addresses) public onlyOwner {
        for (uint i = 0; i < addresses.length; i++) {
            allowList[addresses[i]] = true;
        }
    }

    function removeFromAllowList(address[] memory addresses) public onlyOwner {
        for (uint i = 0; i < addresses.length; i++) {
            allowList[addresses[i]] = false;
        }
    }
}