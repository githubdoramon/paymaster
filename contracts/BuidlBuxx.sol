// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract BuidlBuxx is ERC20, Ownable {

    mapping(address => bool) public allowList;

    modifier onlyAllowListedOrOwner() {
        require(allowList[msg.sender] || owner() == _msgSender(), "Not allowlisted or owner");
        _;
    }

    constructor() ERC20("BUIDL BUXX", "BUXX") {
        _mint(address(this), 100000 * 10 ** decimals());
    }

    function decimals() public view virtual override returns (uint8) {
        return 2;
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    function claim(address to, uint256 amount) public onlyAllowListedOrOwner {
        _transfer(address(this), to, amount);
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