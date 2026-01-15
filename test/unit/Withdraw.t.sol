// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {BulkSend} from "../../contracts/evm/BulkSend.sol";
import {MockERC20} from "../mocks/MockERC20.sol";

contract WithdrawTest is Test {
    BulkSend public bulkSend;
    MockERC20 public token;
    address public owner;
    address public alice = makeAddr("alice");

    function setUp() public {
        owner = address(this);
        bulkSend = new BulkSend();
        vm.deal(address(bulkSend), 10 ether);
        token = new MockERC20("Test", "TST");
        token.mint(address(bulkSend), 1000e18);
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

    function test_withdrawStuckToken_success() public {
        uint256 balanceBefore = token.balanceOf(alice);
        bulkSend.withdrawStuckToken(address(token), alice);
        assertEq(token.balanceOf(alice), balanceBefore + 1000e18);
        assertEq(token.balanceOf(address(bulkSend)), 0);
    }

    function test_withdrawStuckToken_revertsOnNonOwner() public {
        vm.prank(alice);
        vm.expectRevert();
        bulkSend.withdrawStuckToken(address(token), alice);
    }

    function test_withdrawStuckToken_revertsOnZeroTokenAddress() public {
        vm.expectRevert(BulkSend.ZeroAddress.selector);
        bulkSend.withdrawStuckToken(address(0), alice);
    }

    function test_withdrawStuckToken_revertsOnZeroRecipientAddress() public {
        vm.expectRevert(BulkSend.ZeroAddress.selector);
        bulkSend.withdrawStuckToken(address(token), address(0));
    }
}
