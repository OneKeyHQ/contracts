// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable2Step, Ownable} from "openzeppelin-contracts/contracts/access/Ownable2Step.sol";
import {ReentrancyGuard} from "openzeppelin-contracts/contracts/security/ReentrancyGuard.sol";
import {SafeERC20, IERC20} from "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC721} from "openzeppelin-contracts/contracts/token/ERC721/IERC721.sol";
import {IERC1155} from "openzeppelin-contracts/contracts/token/ERC1155/IERC1155.sol";
import {ERC1155Holder} from "openzeppelin-contracts/contracts/token/ERC1155/utils/ERC1155Holder.sol";

contract BulkSend is Ownable2Step, ReentrancyGuard, ERC1155Holder {
    using SafeERC20 for IERC20;

    // 500 recipients * ~38k gas per transfer ≈ 19M gas, safely under 30M block gas limit
    uint256 public constant MAX_BATCH = 500;

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
    error BatchTooLarge();

    event NativeSent(address indexed from, address indexed to, uint256 amount);
    event TokenSent(address indexed token, address indexed from, address indexed to, uint256 amount);
    event ERC721Sent(address indexed token, address indexed from, address indexed to, uint256 tokenId);
    event ERC1155Sent(address indexed token, address indexed from, address indexed to, uint256 tokenId, uint256 amount);
    event StuckNativeWithdrawn(address indexed to, uint256 amount);
    event StuckTokenWithdrawn(address indexed token, address indexed to, uint256 amount);
    event StuckERC721Withdrawn(address indexed token, address indexed to, uint256 tokenId);
    event StuckERC1155Withdrawn(address indexed token, address indexed to, uint256 tokenId, uint256 amount);

    function sendNative(TokenTransfer[] calldata transfers) external payable nonReentrant {
        uint256 len = transfers.length;
        if (len == 0) revert EmptyArray();
        if (len > MAX_BATCH) revert BatchTooLarge();

        uint256 total;
        for (uint256 i; i < len;) {
            TokenTransfer calldata t = transfers[i];
            if (t.recipient == address(0)) revert ZeroAddress();
            if (t.amount == 0) revert ZeroAmount();
            total += t.amount;
            unchecked {
                ++i;
            }
        }

        if (msg.value < total) revert InsufficientValue();

        for (uint256 i; i < len;) {
            TokenTransfer calldata t = transfers[i];
            (bool success,) = t.recipient.call{value: t.amount}("");
            if (!success) revert TransferFailed();
            emit NativeSent(msg.sender, t.recipient, t.amount);
            unchecked {
                ++i;
            }
        }

        uint256 remaining = msg.value - total;
        if (remaining > 0) {
            (bool success,) = msg.sender.call{value: remaining}("");
            if (!success) revert RefundFailed();
        }
    }

    function sendNativeSameAmount(address[] calldata recipients, uint256 amount) external payable nonReentrant {
        uint256 len = recipients.length;
        if (len == 0) revert EmptyArray();
        if (len > MAX_BATCH) revert BatchTooLarge();
        if (amount == 0) revert ZeroAmount();

        uint256 total = len * amount;
        if (msg.value < total) revert InsufficientValue();

        for (uint256 i; i < len;) {
            if (recipients[i] == address(0)) revert ZeroAddress();
            (bool success,) = recipients[i].call{value: amount}("");
            if (!success) revert TransferFailed();
            emit NativeSent(msg.sender, recipients[i], amount);
            unchecked {
                ++i;
            }
        }

        uint256 remaining = msg.value - total;
        if (remaining > 0) {
            (bool success,) = msg.sender.call{value: remaining}("");
            if (!success) revert RefundFailed();
        }
    }

    function sendToken(address token, TokenTransfer[] calldata transfers) external nonReentrant {
        if (token == address(0)) revert ZeroAddress();
        uint256 len = transfers.length;
        if (len == 0) revert EmptyArray();
        if (len > MAX_BATCH) revert BatchTooLarge();

        for (uint256 i; i < len;) {
            TokenTransfer calldata t = transfers[i];
            if (t.recipient == address(0)) revert ZeroAddress();
            if (t.amount == 0) revert ZeroAmount();
            IERC20(token).safeTransferFrom(msg.sender, t.recipient, t.amount);
            emit TokenSent(token, msg.sender, t.recipient, t.amount);
            unchecked {
                ++i;
            }
        }
    }

    function sendTokenSameAmount(address token, address[] calldata recipients, uint256 amount) external nonReentrant {
        if (token == address(0)) revert ZeroAddress();
        uint256 len = recipients.length;
        if (len == 0) revert EmptyArray();
        if (len > MAX_BATCH) revert BatchTooLarge();
        if (amount == 0) revert ZeroAmount();

        for (uint256 i; i < len;) {
            if (recipients[i] == address(0)) revert ZeroAddress();
            IERC20(token).safeTransferFrom(msg.sender, recipients[i], amount);
            emit TokenSent(token, msg.sender, recipients[i], amount);
            unchecked {
                ++i;
            }
        }
    }

    function sendERC721(address token, ERC721Transfer[] calldata transfers) external nonReentrant {
        if (token == address(0)) revert ZeroAddress();
        uint256 len = transfers.length;
        if (len == 0) revert EmptyArray();
        if (len > MAX_BATCH) revert BatchTooLarge();

        for (uint256 i; i < len;) {
            ERC721Transfer calldata t = transfers[i];
            if (t.recipient == address(0)) revert ZeroAddress();
            IERC721(token).transferFrom(msg.sender, t.recipient, t.tokenId);
            emit ERC721Sent(token, msg.sender, t.recipient, t.tokenId);
            unchecked {
                ++i;
            }
        }
    }

    function sendERC1155(address token, ERC1155Transfer[] calldata transfers) external nonReentrant {
        if (token == address(0)) revert ZeroAddress();
        uint256 len = transfers.length;
        if (len == 0) revert EmptyArray();
        if (len > MAX_BATCH) revert BatchTooLarge();

        for (uint256 i; i < len;) {
            ERC1155Transfer calldata t = transfers[i];
            if (t.recipient == address(0)) revert ZeroAddress();
            if (t.amount == 0) revert ZeroAmount();
            IERC1155(token).safeTransferFrom(msg.sender, t.recipient, t.tokenId, t.amount, "");
            emit ERC1155Sent(token, msg.sender, t.recipient, t.tokenId, t.amount);
            unchecked {
                ++i;
            }
        }
    }

    function sendERC1155SameToken(address token, address[] calldata recipients, uint256 tokenId, uint256 amount)
        external
        nonReentrant
    {
        if (token == address(0)) revert ZeroAddress();
        uint256 len = recipients.length;
        if (len == 0) revert EmptyArray();
        if (len > MAX_BATCH) revert BatchTooLarge();
        if (amount == 0) revert ZeroAmount();

        for (uint256 i; i < len;) {
            if (recipients[i] == address(0)) revert ZeroAddress();
            IERC1155(token).safeTransferFrom(msg.sender, recipients[i], tokenId, amount, "");
            emit ERC1155Sent(token, msg.sender, recipients[i], tokenId, amount);
            unchecked {
                ++i;
            }
        }
    }

    function withdrawStuckNative(address to) external onlyOwner {
        if (to == address(0)) revert ZeroAddress();
        uint256 amount = address(this).balance;
        (bool success,) = to.call{value: amount}("");
        if (!success) revert TransferFailed();
        emit StuckNativeWithdrawn(to, amount);
    }

    function withdrawStuckToken(address token, address to) external onlyOwner {
        if (token == address(0)) revert ZeroAddress();
        if (to == address(0)) revert ZeroAddress();
        uint256 amount = IERC20(token).balanceOf(address(this));
        IERC20(token).safeTransfer(to, amount);
        emit StuckTokenWithdrawn(token, to, amount);
    }

    function withdrawStuckERC721(address token, address to, uint256 tokenId) external onlyOwner {
        if (token == address(0)) revert ZeroAddress();
        if (to == address(0)) revert ZeroAddress();
        IERC721(token).transferFrom(address(this), to, tokenId);
        emit StuckERC721Withdrawn(token, to, tokenId);
    }

    function withdrawStuckERC1155(address token, address to, uint256 tokenId, uint256 amount) external onlyOwner {
        if (token == address(0)) revert ZeroAddress();
        if (to == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();
        IERC1155(token).safeTransferFrom(address(this), to, tokenId, amount, "");
        emit StuckERC1155Withdrawn(token, to, tokenId, amount);
    }

    // Gas-optimized ERC20 batch send: transfers tokens to contract first, then distributes
    // Note: Does NOT support fee-on-transfer tokens
    function sendTokenViaContract(address token, TokenTransfer[] calldata transfers) external nonReentrant {
        if (token == address(0)) revert ZeroAddress();
        uint256 len = transfers.length;
        if (len == 0) revert EmptyArray();
        if (len > MAX_BATCH) revert BatchTooLarge();

        uint256 total;
        for (uint256 i; i < len;) {
            TokenTransfer calldata t = transfers[i];
            if (t.recipient == address(0)) revert ZeroAddress();
            if (t.amount == 0) revert ZeroAmount();
            total += t.amount;
            unchecked {
                ++i;
            }
        }

        IERC20(token).safeTransferFrom(msg.sender, address(this), total);

        for (uint256 i; i < len;) {
            TokenTransfer calldata t = transfers[i];
            IERC20(token).safeTransfer(t.recipient, t.amount);
            emit TokenSent(token, msg.sender, t.recipient, t.amount);
            unchecked {
                ++i;
            }
        }
    }

    // Gas-optimized ERC20 batch send with same amount
    // Note: Does NOT support fee-on-transfer tokens
    function sendTokenSameAmountViaContract(address token, address[] calldata recipients, uint256 amount)
        external
        nonReentrant
    {
        if (token == address(0)) revert ZeroAddress();
        uint256 len = recipients.length;
        if (len == 0) revert EmptyArray();
        if (len > MAX_BATCH) revert BatchTooLarge();
        if (amount == 0) revert ZeroAmount();

        uint256 total = len * amount;
        IERC20(token).safeTransferFrom(msg.sender, address(this), total);

        for (uint256 i; i < len;) {
            if (recipients[i] == address(0)) revert ZeroAddress();
            IERC20(token).safeTransfer(recipients[i], amount);
            emit TokenSent(token, msg.sender, recipients[i], amount);
            unchecked {
                ++i;
            }
        }
    }

    receive() external payable {}
}
