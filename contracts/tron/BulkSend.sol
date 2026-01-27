// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ITRC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

interface ITRC721 {
    function transferFrom(address from, address to, uint256 tokenId) external;
}

interface ITRC1155 {
    function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes calldata data) external;
}

contract BulkSend {
    address public owner;
    uint256 private _locked;

    // 500 recipients * ~38k energy per transfer ≈ 19M energy, safely under block limit
    uint256 public constant MAX_BATCH = 500;

    struct TokenTransfer {
        address recipient;
        uint256 amount;
    }

    struct TRC721Transfer {
        address recipient;
        uint256 tokenId;
    }

    struct TRC1155Transfer {
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
    error NotOwner();
    error ReentrancyGuard();
    error BatchTooLarge();

    event TRXSent(address indexed from, address indexed to, uint256 amount);
    event TRC20Sent(address indexed token, address indexed from, address indexed to, uint256 amount);
    event TRC721Sent(address indexed token, address indexed from, address indexed to, uint256 tokenId);
    event TRC1155Sent(address indexed token, address indexed from, address indexed to, uint256 tokenId, uint256 amount);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event StuckTRXWithdrawn(address indexed to, uint256 amount);
    event StuckTRC20Withdrawn(address indexed token, address indexed to, uint256 amount);
    event StuckTRC721Withdrawn(address indexed token, address indexed to, uint256 tokenId);
    event StuckTRC1155Withdrawn(address indexed token, address indexed to, uint256 tokenId, uint256 amount);

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier nonReentrant() {
        if (_locked == 1) revert ReentrancyGuard();
        _locked = 1;
        _;
        _locked = 0;
    }

    constructor() {
        owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress();
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    function sendTRX(TokenTransfer[] calldata transfers) external payable nonReentrant {
        uint256 len = transfers.length;
        if (len == 0) revert EmptyArray();
        if (len > MAX_BATCH) revert BatchTooLarge();

        uint256 total;
        for (uint256 i; i < len;) {
            TokenTransfer calldata t = transfers[i];
            if (t.recipient == address(0)) revert ZeroAddress();
            if (t.amount == 0) revert ZeroAmount();
            total += t.amount;
            unchecked { ++i; }
        }

        if (msg.value < total) revert InsufficientValue();

        for (uint256 i; i < len;) {
            TokenTransfer calldata t = transfers[i];
            (bool success,) = t.recipient.call{value: t.amount}("");
            if (!success) revert TransferFailed();
            emit TRXSent(msg.sender, t.recipient, t.amount);
            unchecked { ++i; }
        }

        uint256 remaining = msg.value - total;
        if (remaining > 0) {
            (bool success,) = msg.sender.call{value: remaining}("");
            if (!success) revert RefundFailed();
        }
    }

    function sendTRXSameAmount(address[] calldata recipients, uint256 amount) external payable nonReentrant {
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
            emit TRXSent(msg.sender, recipients[i], amount);
            unchecked { ++i; }
        }

        uint256 remaining = msg.value - total;
        if (remaining > 0) {
            (bool success,) = msg.sender.call{value: remaining}("");
            if (!success) revert RefundFailed();
        }
    }

    function sendTRC20(address token, TokenTransfer[] calldata transfers) external nonReentrant {
        if (token == address(0)) revert ZeroAddress();
        uint256 len = transfers.length;
        if (len == 0) revert EmptyArray();
        if (len > MAX_BATCH) revert BatchTooLarge();

        for (uint256 i; i < len;) {
            TokenTransfer calldata t = transfers[i];
            if (t.recipient == address(0)) revert ZeroAddress();
            if (t.amount == 0) revert ZeroAmount();
            bool success = ITRC20(token).transferFrom(msg.sender, t.recipient, t.amount);
            if (!success) revert TransferFailed();
            emit TRC20Sent(token, msg.sender, t.recipient, t.amount);
            unchecked { ++i; }
        }
    }

    function sendTRC20SameAmount(address token, address[] calldata recipients, uint256 amount) external nonReentrant {
        if (token == address(0)) revert ZeroAddress();
        uint256 len = recipients.length;
        if (len == 0) revert EmptyArray();
        if (len > MAX_BATCH) revert BatchTooLarge();
        if (amount == 0) revert ZeroAmount();

        for (uint256 i; i < len;) {
            if (recipients[i] == address(0)) revert ZeroAddress();
            bool success = ITRC20(token).transferFrom(msg.sender, recipients[i], amount);
            if (!success) revert TransferFailed();
            emit TRC20Sent(token, msg.sender, recipients[i], amount);
            unchecked { ++i; }
        }
    }

    function sendTRC721(address token, TRC721Transfer[] calldata transfers) external nonReentrant {
        if (token == address(0)) revert ZeroAddress();
        uint256 len = transfers.length;
        if (len == 0) revert EmptyArray();
        if (len > MAX_BATCH) revert BatchTooLarge();

        for (uint256 i; i < len;) {
            TRC721Transfer calldata t = transfers[i];
            if (t.recipient == address(0)) revert ZeroAddress();
            ITRC721(token).transferFrom(msg.sender, t.recipient, t.tokenId);
            emit TRC721Sent(token, msg.sender, t.recipient, t.tokenId);
            unchecked { ++i; }
        }
    }

    function sendTRC1155(address token, TRC1155Transfer[] calldata transfers) external nonReentrant {
        if (token == address(0)) revert ZeroAddress();
        uint256 len = transfers.length;
        if (len == 0) revert EmptyArray();
        if (len > MAX_BATCH) revert BatchTooLarge();

        for (uint256 i; i < len;) {
            TRC1155Transfer calldata t = transfers[i];
            if (t.recipient == address(0)) revert ZeroAddress();
            if (t.amount == 0) revert ZeroAmount();
            ITRC1155(token).safeTransferFrom(msg.sender, t.recipient, t.tokenId, t.amount, "");
            emit TRC1155Sent(token, msg.sender, t.recipient, t.tokenId, t.amount);
            unchecked { ++i; }
        }
    }

    function sendTRC1155SameToken(address token, address[] calldata recipients, uint256 tokenId, uint256 amount) external nonReentrant {
        if (token == address(0)) revert ZeroAddress();
        uint256 len = recipients.length;
        if (len == 0) revert EmptyArray();
        if (len > MAX_BATCH) revert BatchTooLarge();
        if (amount == 0) revert ZeroAmount();

        for (uint256 i; i < len;) {
            if (recipients[i] == address(0)) revert ZeroAddress();
            ITRC1155(token).safeTransferFrom(msg.sender, recipients[i], tokenId, amount, "");
            emit TRC1155Sent(token, msg.sender, recipients[i], tokenId, amount);
            unchecked { ++i; }
        }
    }

    // Gas-optimized TRC20 batch send: transfers tokens to contract first, then distributes
    // Note: Does NOT support fee-on-transfer tokens
    function sendTRC20ViaContract(address token, TokenTransfer[] calldata transfers) external nonReentrant {
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
            unchecked { ++i; }
        }

        bool success = ITRC20(token).transferFrom(msg.sender, address(this), total);
        if (!success) revert TransferFailed();

        for (uint256 i; i < len;) {
            TokenTransfer calldata t = transfers[i];
            success = ITRC20(token).transfer(t.recipient, t.amount);
            if (!success) revert TransferFailed();
            emit TRC20Sent(token, msg.sender, t.recipient, t.amount);
            unchecked { ++i; }
        }
    }

    // Gas-optimized TRC20 batch send with same amount
    // Note: Does NOT support fee-on-transfer tokens
    function sendTRC20SameAmountViaContract(address token, address[] calldata recipients, uint256 amount) external nonReentrant {
        if (token == address(0)) revert ZeroAddress();
        uint256 len = recipients.length;
        if (len == 0) revert EmptyArray();
        if (len > MAX_BATCH) revert BatchTooLarge();
        if (amount == 0) revert ZeroAmount();

        uint256 total = len * amount;
        bool success = ITRC20(token).transferFrom(msg.sender, address(this), total);
        if (!success) revert TransferFailed();

        for (uint256 i; i < len;) {
            if (recipients[i] == address(0)) revert ZeroAddress();
            success = ITRC20(token).transfer(recipients[i], amount);
            if (!success) revert TransferFailed();
            emit TRC20Sent(token, msg.sender, recipients[i], amount);
            unchecked { ++i; }
        }
    }

    function withdrawStuckTRX(address to) external onlyOwner {
        if (to == address(0)) revert ZeroAddress();
        uint256 amount = address(this).balance;
        (bool success,) = to.call{value: amount}("");
        if (!success) revert TransferFailed();
        emit StuckTRXWithdrawn(to, amount);
    }

    function withdrawStuckTRC20(address token, address to) external onlyOwner {
        if (token == address(0)) revert ZeroAddress();
        if (to == address(0)) revert ZeroAddress();
        uint256 amount = ITRC20(token).balanceOf(address(this));
        bool success = ITRC20(token).transfer(to, amount);
        if (!success) revert TransferFailed();
        emit StuckTRC20Withdrawn(token, to, amount);
    }

    function withdrawStuckTRC721(address token, address to, uint256 tokenId) external onlyOwner {
        if (token == address(0)) revert ZeroAddress();
        if (to == address(0)) revert ZeroAddress();
        ITRC721(token).transferFrom(address(this), to, tokenId);
        emit StuckTRC721Withdrawn(token, to, tokenId);
    }

    function withdrawStuckTRC1155(address token, address to, uint256 tokenId, uint256 amount) external onlyOwner {
        if (token == address(0)) revert ZeroAddress();
        if (to == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();
        ITRC1155(token).safeTransferFrom(address(this), to, tokenId, amount, "");
        emit StuckTRC1155Withdrawn(token, to, tokenId, amount);
    }

    function onERC1155Received(address, address, uint256, uint256, bytes calldata) external pure returns (bytes4) {
        return this.onERC1155Received.selector;
    }

    function onERC1155BatchReceived(address, address, uint256[] calldata, uint256[] calldata, bytes calldata) external pure returns (bytes4) {
        return this.onERC1155BatchReceived.selector;
    }

    function supportsInterface(bytes4 interfaceId) external pure returns (bool) {
        return interfaceId == 0x01ffc9a7 || interfaceId == 0x4e2312e0;
    }

    receive() external payable {}
}
