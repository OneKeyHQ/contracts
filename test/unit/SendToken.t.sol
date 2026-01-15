// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {BulkSend} from "../../contracts/evm/BulkSend.sol";
import {MockERC20} from "../mocks/MockERC20.sol";

contract SendTokenTest is Test {
    BulkSend public bulkSend;
    MockERC20 public token;
    address public alice = makeAddr("alice");
    address public bob = makeAddr("bob");

    function setUp() public {
        bulkSend = new BulkSend();
        token = new MockERC20("Test Token", "TEST");
        token.mint(address(this), 1000 ether);
        token.approve(address(bulkSend), type(uint256).max);
    }

    function test_sendToken_success() public {
        BulkSend.TokenTransfer[] memory transfers = new BulkSend.TokenTransfer[](2);
        transfers[0] = BulkSend.TokenTransfer(alice, 100 ether);
        transfers[1] = BulkSend.TokenTransfer(bob, 200 ether);

        bulkSend.sendToken(address(token), transfers);

        assertEq(token.balanceOf(alice), 100 ether);
        assertEq(token.balanceOf(bob), 200 ether);
    }

    function test_sendToken_revertsOnEmptyArray() public {
        BulkSend.TokenTransfer[] memory transfers = new BulkSend.TokenTransfer[](0);

        vm.expectRevert(BulkSend.EmptyArray.selector);
        bulkSend.sendToken(address(token), transfers);
    }

    function test_sendToken_revertsOnZeroAddress() public {
        BulkSend.TokenTransfer[] memory transfers = new BulkSend.TokenTransfer[](1);
        transfers[0] = BulkSend.TokenTransfer(address(0), 100 ether);

        vm.expectRevert(BulkSend.ZeroAddress.selector);
        bulkSend.sendToken(address(token), transfers);
    }

    function test_sendToken_revertsOnZeroAmount() public {
        BulkSend.TokenTransfer[] memory transfers = new BulkSend.TokenTransfer[](1);
        transfers[0] = BulkSend.TokenTransfer(alice, 0);

        vm.expectRevert(BulkSend.ZeroAmount.selector);
        bulkSend.sendToken(address(token), transfers);
    }

    function test_sendToken_revertsOnZeroTokenAddress() public {
        BulkSend.TokenTransfer[] memory transfers = new BulkSend.TokenTransfer[](1);
        transfers[0] = BulkSend.TokenTransfer(alice, 100 ether);

        vm.expectRevert(BulkSend.ZeroAddress.selector);
        bulkSend.sendToken(address(0), transfers);
    }

    function test_sendTokenSameAmount_success() public {
        address[] memory recipients = new address[](2);
        recipients[0] = alice;
        recipients[1] = bob;

        bulkSend.sendTokenSameAmount(address(token), recipients, 100 ether);

        assertEq(token.balanceOf(alice), 100 ether);
        assertEq(token.balanceOf(bob), 100 ether);
    }

    function test_sendTokenSameAmount_revertsOnEmptyArray() public {
        address[] memory recipients = new address[](0);

        vm.expectRevert(BulkSend.EmptyArray.selector);
        bulkSend.sendTokenSameAmount(address(token), recipients, 100 ether);
    }

    function test_sendTokenSameAmount_revertsOnZeroAmount() public {
        address[] memory recipients = new address[](1);
        recipients[0] = alice;

        vm.expectRevert(BulkSend.ZeroAmount.selector);
        bulkSend.sendTokenSameAmount(address(token), recipients, 0);
    }
}
