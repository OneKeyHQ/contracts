// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "openzeppelin-contracts/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "openzeppelin-contracts/contracts/security/ReentrancyGuard.sol";
import {SafeERC20, IERC20} from "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC721} from "openzeppelin-contracts/contracts/token/ERC721/IERC721.sol";
import {IERC1155} from "openzeppelin-contracts/contracts/token/ERC1155/IERC1155.sol";

contract BulkSend is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    struct TokenTransfer {
        address recipient;
        uint256 amount;
    }

    struct ERC721Transfer {
        address recipient;
        uint256 tokenId;
    }

    struct ERC1155Transfer {
        address recipient;
        uint256 tokenId;
        uint256 amount;
    }

    error EmptyArray();
    error ZeroAddress();
    error ZeroAmount();
    error InsufficientValue();
    error RefundFailed();
    error TransferFailed();

    event NativeSent(address indexed from, address indexed to, uint256 amount);
    event TokenSent(address indexed token, address indexed from, address indexed to, uint256 amount);
    event ERC721Sent(address indexed token, address indexed from, address indexed to, uint256 tokenId);
    event ERC1155Sent(address indexed token, address indexed from, address indexed to, uint256 tokenId, uint256 amount);

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

    function sendToken(address token, TokenTransfer[] calldata transfers) external nonReentrant {
        if (token == address(0)) revert ZeroAddress();
        uint256 len = transfers.length;
        if (len == 0) revert EmptyArray();

        for (uint256 i; i < len; ) {
            if (transfers[i].recipient == address(0)) revert ZeroAddress();
            if (transfers[i].amount == 0) revert ZeroAmount();
            IERC20(token).safeTransferFrom(msg.sender, transfers[i].recipient, transfers[i].amount);
            emit TokenSent(token, msg.sender, transfers[i].recipient, transfers[i].amount);
            unchecked { ++i; }
        }
    }

    function sendTokenSameAmount(address token, address[] calldata recipients, uint256 amount) external nonReentrant {
        if (token == address(0)) revert ZeroAddress();
        uint256 len = recipients.length;
        if (len == 0) revert EmptyArray();
        if (amount == 0) revert ZeroAmount();

        for (uint256 i; i < len; ) {
            if (recipients[i] == address(0)) revert ZeroAddress();
            IERC20(token).safeTransferFrom(msg.sender, recipients[i], amount);
            emit TokenSent(token, msg.sender, recipients[i], amount);
            unchecked { ++i; }
        }
    }

    function sendERC721(address token, ERC721Transfer[] calldata transfers) external nonReentrant {
        if (token == address(0)) revert ZeroAddress();
        uint256 len = transfers.length;
        if (len == 0) revert EmptyArray();

        for (uint256 i; i < len; ) {
            if (transfers[i].recipient == address(0)) revert ZeroAddress();
            IERC721(token).transferFrom(msg.sender, transfers[i].recipient, transfers[i].tokenId);
            emit ERC721Sent(token, msg.sender, transfers[i].recipient, transfers[i].tokenId);
            unchecked { ++i; }
        }
    }

    function sendERC1155(address token, ERC1155Transfer[] calldata transfers) external nonReentrant {
        if (token == address(0)) revert ZeroAddress();
        uint256 len = transfers.length;
        if (len == 0) revert EmptyArray();

        for (uint256 i; i < len; ) {
            if (transfers[i].recipient == address(0)) revert ZeroAddress();
            if (transfers[i].amount == 0) revert ZeroAmount();
            IERC1155(token).safeTransferFrom(msg.sender, transfers[i].recipient, transfers[i].tokenId, transfers[i].amount, "");
            emit ERC1155Sent(token, msg.sender, transfers[i].recipient, transfers[i].tokenId, transfers[i].amount);
            unchecked { ++i; }
        }
    }

    function sendERC1155SameToken(address token, address[] calldata recipients, uint256 tokenId, uint256 amount) external nonReentrant {
        if (token == address(0)) revert ZeroAddress();
        uint256 len = recipients.length;
        if (len == 0) revert EmptyArray();
        if (amount == 0) revert ZeroAmount();

        for (uint256 i; i < len; ) {
            if (recipients[i] == address(0)) revert ZeroAddress();
            IERC1155(token).safeTransferFrom(msg.sender, recipients[i], tokenId, amount, "");
            emit ERC1155Sent(token, msg.sender, recipients[i], tokenId, amount);
            unchecked { ++i; }
        }
    }
}
