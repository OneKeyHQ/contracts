// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "openzeppelin-contracts/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "openzeppelin-contracts/contracts/security/ReentrancyGuard.sol";

contract BulkSend is Ownable, ReentrancyGuard {
    struct TokenTransfer {
        address recipient;
        uint256 amount;
    }

    error EmptyArray();
    error ZeroAddress();
    error ZeroAmount();
    error InsufficientValue();
    error RefundFailed();
    error TransferFailed();

    event NativeSent(address indexed from, address indexed to, uint256 amount);

    function sendNative(TokenTransfer[] calldata transfers) external payable nonReentrant {
        uint256 len = transfers.length;
        if (len == 0) revert EmptyArray();

        uint256 total;
        for (uint256 i; i < len; ) {
            if (transfers[i].recipient == address(0)) revert ZeroAddress();
            if (transfers[i].amount == 0) revert ZeroAmount();
            total += transfers[i].amount;
            unchecked { ++i; }
        }

        if (msg.value < total) revert InsufficientValue();

        for (uint256 i; i < len; ) {
            (bool success, ) = transfers[i].recipient.call{value: transfers[i].amount}("");
            if (!success) revert TransferFailed();
            emit NativeSent(msg.sender, transfers[i].recipient, transfers[i].amount);
            unchecked { ++i; }
        }

        uint256 remaining = msg.value - total;
        if (remaining > 0) {
            (bool success, ) = msg.sender.call{value: remaining}("");
            if (!success) revert RefundFailed();
        }
    }

    function sendNativeSameAmount(address[] calldata recipients, uint256 amount) external payable nonReentrant {
        uint256 len = recipients.length;
        if (len == 0) revert EmptyArray();
        if (amount == 0) revert ZeroAmount();

        uint256 total = len * amount;
        if (msg.value < total) revert InsufficientValue();

        for (uint256 i; i < len; ) {
            if (recipients[i] == address(0)) revert ZeroAddress();
            (bool success, ) = recipients[i].call{value: amount}("");
            if (!success) revert TransferFailed();
            emit NativeSent(msg.sender, recipients[i], amount);
            unchecked { ++i; }
        }

        uint256 remaining = msg.value - total;
        if (remaining > 0) {
            (bool success, ) = msg.sender.call{value: remaining}("");
            if (!success) revert RefundFailed();
        }
    }
}
