// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {BulkSend} from "../../contracts/evm/BulkSend.sol";

contract WithdrawTest is Test {
    BulkSend public bulkSend;
    address public owner;
    address public alice = makeAddr("alice");

    function setUp() public {
        owner = address(this);
        bulkSend = new BulkSend();
        vm.deal(address(bulkSend), 10 ether);
    }

    function test_withdrawStuckNative_success() public {
        uint256 balanceBefore = alice.balance;
        bulkSend.withdrawStuckNative(alice);
        assertEq(alice.balance, balanceBefore + 10 ether);
        assertEq(address(bulkSend).balance, 0);
    }

    function test_withdrawStuckNative_revertsOnNonOwner() public {
        vm.prank(alice);
        vm.expectRevert();
        bulkSend.withdrawStuckNative(alice);
    }

    function test_withdrawStuckNative_revertsOnZeroAddress() public {
        vm.expectRevert(BulkSend.ZeroAddress.selector);
        bulkSend.withdrawStuckNative(address(0));
    }
}
