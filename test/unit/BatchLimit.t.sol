// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {BulkSend} from "../../contracts/evm/BulkSend.sol";
import {MockERC20} from "../mocks/MockERC20.sol";
import {MockERC721} from "../mocks/MockERC721.sol";
import {MockERC1155} from "../mocks/MockERC1155.sol";

contract BatchLimitTest is Test {
    BulkSend public bulkSend;
    MockERC20 public token;
    MockERC721 public nft;
    MockERC1155 public multiToken;

    function setUp() public {
        bulkSend = new BulkSend();
        token = new MockERC20("Test Token", "TEST");
        nft = new MockERC721("Test NFT", "TNFT");
        multiToken = new MockERC1155();

        token.mint(address(this), 100000 ether);
        token.approve(address(bulkSend), type(uint256).max);
    }

    function test_sendNative_revertsOnBatchTooLarge() public {
        BulkSend.TokenTransfer[] memory transfers = new BulkSend.TokenTransfer[](501);
        for (uint256 i; i < 501; i++) {
            transfers[i] = BulkSend.TokenTransfer(address(uint160(0x1000 + i)), 1 wei);
        }

        vm.expectRevert(BulkSend.BatchTooLarge.selector);
        bulkSend.sendNative{value: 501 wei}(transfers);
    }

    function test_sendNativeSameAmount_revertsOnBatchTooLarge() public {
        address[] memory recipients = new address[](501);
        for (uint256 i; i < 501; i++) {
            recipients[i] = address(uint160(0x1000 + i));
        }

        vm.expectRevert(BulkSend.BatchTooLarge.selector);
        bulkSend.sendNativeSameAmount{value: 501 wei}(recipients, 1 wei);
    }

    function test_sendToken_revertsOnBatchTooLarge() public {
        BulkSend.TokenTransfer[] memory transfers = new BulkSend.TokenTransfer[](501);
        for (uint256 i; i < 501; i++) {
            transfers[i] = BulkSend.TokenTransfer(address(uint160(0x1000 + i)), 1 ether);
        }

        vm.expectRevert(BulkSend.BatchTooLarge.selector);
        bulkSend.sendToken(address(token), transfers);
    }

    function test_sendTokenSameAmount_revertsOnBatchTooLarge() public {
        address[] memory recipients = new address[](501);
        for (uint256 i; i < 501; i++) {
            recipients[i] = address(uint160(0x1000 + i));
        }

        vm.expectRevert(BulkSend.BatchTooLarge.selector);
        bulkSend.sendTokenSameAmount(address(token), recipients, 1 ether);
    }

    function test_sendERC721_revertsOnBatchTooLarge() public {
        BulkSend.ERC721Transfer[] memory transfers = new BulkSend.ERC721Transfer[](501);
        for (uint256 i; i < 501; i++) {
            transfers[i] = BulkSend.ERC721Transfer(address(uint160(0x1000 + i)), i);
        }

        vm.expectRevert(BulkSend.BatchTooLarge.selector);
        bulkSend.sendERC721(address(nft), transfers);
    }

    function test_sendERC1155_revertsOnBatchTooLarge() public {
        BulkSend.ERC1155Transfer[] memory transfers = new BulkSend.ERC1155Transfer[](501);
        for (uint256 i; i < 501; i++) {
            transfers[i] = BulkSend.ERC1155Transfer(address(uint160(0x1000 + i)), 1, 1);
        }

        vm.expectRevert(BulkSend.BatchTooLarge.selector);
        bulkSend.sendERC1155(address(multiToken), transfers);
    }

    function test_sendERC1155SameToken_revertsOnBatchTooLarge() public {
        address[] memory recipients = new address[](501);
        for (uint256 i; i < 501; i++) {
            recipients[i] = address(uint160(0x1000 + i));
        }

        vm.expectRevert(BulkSend.BatchTooLarge.selector);
        bulkSend.sendERC1155SameToken(address(multiToken), recipients, 1, 1);
    }

    function test_sendTokenViaContract_revertsOnBatchTooLarge() public {
        BulkSend.TokenTransfer[] memory transfers = new BulkSend.TokenTransfer[](501);
        for (uint256 i; i < 501; i++) {
            transfers[i] = BulkSend.TokenTransfer(address(uint160(0x1000 + i)), 1 ether);
        }

        vm.expectRevert(BulkSend.BatchTooLarge.selector);
        bulkSend.sendTokenViaContract(address(token), transfers);
    }

    function test_sendTokenSameAmountViaContract_revertsOnBatchTooLarge() public {
        address[] memory recipients = new address[](501);
        for (uint256 i; i < 501; i++) {
            recipients[i] = address(uint160(0x1000 + i));
        }

        vm.expectRevert(BulkSend.BatchTooLarge.selector);
        bulkSend.sendTokenSameAmountViaContract(address(token), recipients, 1 ether);
    }

    function test_maxBatchConstant() public {
        assertEq(bulkSend.MAX_BATCH(), 500);
    }
}
