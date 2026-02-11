// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {BulkSend} from "../../contracts/evm/BulkSend.sol";

contract SendNativeTest is Test {
    BulkSend public bulkSend;
    address public alice = makeAddr("alice");
    address public bob = makeAddr("bob");

    function setUp() public {
        bulkSend = new BulkSend();
        vm.deal(address(this), 100 ether);
    }

    function test_sendNative_success() public {
        BulkSend.TokenTransfer[] memory transfers = new BulkSend.TokenTransfer[](2);
        transfers[0] = BulkSend.TokenTransfer(alice, 1 ether);
        transfers[1] = BulkSend.TokenTransfer(bob, 2 ether);

        bulkSend.sendNative{value: 3 ether}(transfers);

        assertEq(alice.balance, 1 ether);
        assertEq(bob.balance, 2 ether);
    }

    function test_sendNative_refundsExcess() public {
        BulkSend.TokenTransfer[] memory transfers = new BulkSend.TokenTransfer[](1);
        transfers[0] = BulkSend.TokenTransfer(alice, 1 ether);

        uint256 balanceBefore = address(this).balance;
        bulkSend.sendNative{value: 2 ether}(transfers);

        assertEq(alice.balance, 1 ether);
        assertEq(address(this).balance, balanceBefore - 1 ether);
    }

    function test_sendNative_revertsOnInsufficientValue() public {
        BulkSend.TokenTransfer[] memory transfers = new BulkSend.TokenTransfer[](1);
        transfers[0] = BulkSend.TokenTransfer(alice, 1 ether);

        vm.expectRevert(BulkSend.InsufficientValue.selector);
        bulkSend.sendNative{value: 0.5 ether}(transfers);
    }

    function test_sendNative_revertsOnEmptyArray() public {
        BulkSend.TokenTransfer[] memory transfers = new BulkSend.TokenTransfer[](0);

        vm.expectRevert(BulkSend.EmptyArray.selector);
        bulkSend.sendNative{value: 1 ether}(transfers);
    }

    function test_sendNative_revertsOnZeroAddress() public {
        BulkSend.TokenTransfer[] memory transfers = new BulkSend.TokenTransfer[](1);
        transfers[0] = BulkSend.TokenTransfer(address(0), 1 ether);

        vm.expectRevert(BulkSend.ZeroAddress.selector);
        bulkSend.sendNative{value: 1 ether}(transfers);
    }

    function test_sendNative_revertsOnZeroAmount() public {
        BulkSend.TokenTransfer[] memory transfers = new BulkSend.TokenTransfer[](1);
        transfers[0] = BulkSend.TokenTransfer(alice, 0);

        vm.expectRevert(BulkSend.ZeroAmount.selector);
        bulkSend.sendNative{value: 1 ether}(transfers);
    }

    receive() external payable {}
}
