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

    event TRXSent(address indexed from, address indexed to, uint256 amount);
    event TRC20Sent(address indexed token, address indexed from, address indexed to, uint256 amount);
    event TRC721Sent(address indexed token, address indexed from, address indexed to, uint256 tokenId);
    event TRC1155Sent(address indexed token, address indexed from, address indexed to, uint256 tokenId, uint256 amount);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

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

        uint256 total;
        for (uint256 i; i < len;) {
            if (transfers[i].recipient == address(0)) revert ZeroAddress();
            if (transfers[i].amount == 0) revert ZeroAmount();
            total += transfers[i].amount;
            unchecked { ++i; }
        }

        if (msg.value < total) revert InsufficientValue();

        for (uint256 i; i < len;) {
            (bool success,) = transfers[i].recipient.call{value: transfers[i].amount}("");
            if (!success) revert TransferFailed();
            emit TRXSent(msg.sender, transfers[i].recipient, transfers[i].amount);
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

        for (uint256 i; i < len;) {
            if (transfers[i].recipient == address(0)) revert ZeroAddress();
            if (transfers[i].amount == 0) revert ZeroAmount();
            bool success = ITRC20(token).transferFrom(msg.sender, transfers[i].recipient, transfers[i].amount);
            if (!success) revert TransferFailed();
            emit TRC20Sent(token, msg.sender, transfers[i].recipient, transfers[i].amount);
            unchecked { ++i; }
        }
    }

    function sendTRC20SameAmount(address token, address[] calldata recipients, uint256 amount) external nonReentrant {
        if (token == address(0)) revert ZeroAddress();
        uint256 len = recipients.length;
        if (len == 0) revert EmptyArray();
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

        for (uint256 i; i < len;) {
            if (transfers[i].recipient == address(0)) revert ZeroAddress();
            ITRC721(token).transferFrom(msg.sender, transfers[i].recipient, transfers[i].tokenId);
            emit TRC721Sent(token, msg.sender, transfers[i].recipient, transfers[i].tokenId);
            unchecked { ++i; }
        }
    }

    function sendTRC1155(address token, TRC1155Transfer[] calldata transfers) external nonReentrant {
        if (token == address(0)) revert ZeroAddress();
        uint256 len = transfers.length;
        if (len == 0) revert EmptyArray();

        for (uint256 i; i < len;) {
            if (transfers[i].recipient == address(0)) revert ZeroAddress();
            if (transfers[i].amount == 0) revert ZeroAmount();
            ITRC1155(token).safeTransferFrom(msg.sender, transfers[i].recipient, transfers[i].tokenId, transfers[i].amount, "");
            emit TRC1155Sent(token, msg.sender, transfers[i].recipient, transfers[i].tokenId, transfers[i].amount);
            unchecked { ++i; }
        }
    }

    function sendTRC1155SameToken(address token, address[] calldata recipients, uint256 tokenId, uint256 amount) external nonReentrant {
        if (token == address(0)) revert ZeroAddress();
        uint256 len = recipients.length;
        if (len == 0) revert EmptyArray();
        if (amount == 0) revert ZeroAmount();

        for (uint256 i; i < len;) {
            if (recipients[i] == address(0)) revert ZeroAddress();
            ITRC1155(token).safeTransferFrom(msg.sender, recipients[i], tokenId, amount, "");
            emit TRC1155Sent(token, msg.sender, recipients[i], tokenId, amount);
            unchecked { ++i; }
        }
    }

    function withdrawStuckTRX(address to) external onlyOwner {
        if (to == address(0)) revert ZeroAddress();
        (bool success,) = to.call{value: address(this).balance}("");
        if (!success) revert TransferFailed();
    }

    function withdrawStuckTRC20(address token, address to) external onlyOwner {
        if (token == address(0)) revert ZeroAddress();
        if (to == address(0)) revert ZeroAddress();
        uint256 balance = ITRC20(token).balanceOf(address(this));
        bool success = ITRC20(token).transfer(to, balance);
        if (!success) revert TransferFailed();
    }

    function withdrawStuckTRC721(address token, address to, uint256 tokenId) external onlyOwner {
        if (token == address(0)) revert ZeroAddress();
        if (to == address(0)) revert ZeroAddress();
        ITRC721(token).transferFrom(address(this), to, tokenId);
    }

    function withdrawStuckTRC1155(address token, address to, uint256 tokenId, uint256 amount) external onlyOwner {
        if (token == address(0)) revert ZeroAddress();
        if (to == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();
        ITRC1155(token).safeTransferFrom(address(this), to, tokenId, amount, "");
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
}
