// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {IPaymaster, ExecutionResult} from "@matterlabs/zksync-contracts/l2/system-contracts/interfaces/IPaymaster.sol";
import {IPaymasterFlow} from "@matterlabs/zksync-contracts/l2/system-contracts/interfaces/IPaymasterFlow.sol";
import {TransactionHelper, Transaction} from "@matterlabs/zksync-contracts/l2/system-contracts/TransactionHelper.sol";
import {BUIDLBUXX} from "./BuidlBuxx.sol";
import "@matterlabs/zksync-contracts/l2/system-contracts/Constants.sol";

contract BuildBuxxPaymaster is IPaymaster {

    address public allowedToken;

    modifier onlyBootloader() {
        require(
            msg.sender == BOOTLOADER_FORMAL_ADDRESS,
            "Only bootloader can call this method"
        );
        // Continure execution if called from the bootloader.
        _;
    }

    constructor(address _erc20) {
        allowedToken = _erc20;
    }

    function validateAndPayForPaymasterTransaction(
        bytes32 _txHash,
        bytes32 _suggestedSignedHash,
        Transaction calldata _transaction
    ) external payable override onlyBootloader returns (bytes memory context) {
        require(
            _transaction.paymasterInput.length >= 4,
            "The standard paymaster input must be at least 4 bytes long"
        );

        bytes4 paymasterInputSelector = bytes4(
            _transaction.paymasterInput[0:4]
        );
       if (paymasterInputSelector == IPaymasterFlow.general.selector) {

            bytes4 selector = BUIDLBUXX.transferWithMessage.selector;
            bytes4 calldataSelector = bytes4(_transaction.data);
            
            require(selector == calldataSelector, "Function called is not supported by this Paymaster");
            require(address(uint160(uint256(_transaction.to))) == allowedToken, "Contract called is not supported by this Paymaster");

            address userAddress = address(uint160(_transaction.from));
            
            uint256 accountBalance = BUIDLBUXX(allowedToken).balanceOf(userAddress);
            require(
                accountBalance > 0,
                "Account do not hold BUIDL BUCKS"
            );

            // Note, that while the minimal amount of ETH needed is tx.ergsPrice * tx.ergsLimit,
            // neither paymaster nor account are allowed to access this context variable.
            uint256 requiredETH = _transaction.ergsLimit *
                _transaction.maxFeePerErg;

            // The bootloader never returns any data, so it can safely be ignored here.
            (bool success, ) = payable(BOOTLOADER_FORMAL_ADDRESS).call{
                value: requiredETH
            }("");
            require(success, "Failed to transfer funds to the bootloader");
        } else {
            revert("Unsupported paymaster flow");
        }
    }

    function postOp(
        bytes calldata _context,
        Transaction calldata _transaction,
        bytes32 _txHash,
        bytes32 _suggestedSignedHash,
        ExecutionResult _txResult,
        uint256 _maxRefundedErgs
    ) external payable onlyBootloader {
        // This contract does not support any refunding logic
    }

    receive() external payable {}

    function toHexDigit(uint8 d) pure internal returns (bytes1) {                                                                                      
    if (0 <= d && d <= 9) {                                                                                                                      
        return bytes1(uint8(bytes1('0')) + d);                                                                                                       
    } else if (10 <= uint8(d) && uint8(d) <= 15) {                                                                                               
        return bytes1(uint8(bytes1('a')) + d - 10);                                                                                                  
    }                                                                                                                                            
    revert();                                                                                                                                    
}   
}