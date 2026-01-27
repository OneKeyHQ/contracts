// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {BulkSend} from "../../contracts/evm/BulkSend.sol";
import {MockERC20} from "../mocks/MockERC20.sol";

contract SendTokenViaContractTest is Test {
    BulkSend public bulkSend;
    MockERC20 public token;
    address public alice = makeAddr("alice");
    address public bob = makeAddr("bob");
    address public charlie = makeAddr("charlie");

    function setUp() public {
        bulkSend = new BulkSend();
        token = new MockERC20("Test Token", "TEST");
        token.mint(address(this), 10000 ether);
        token.approve(address(bulkSend), type(uint256).max);
    }

    function test_sendTokenViaContract_success() public {
        BulkSend.TokenTransfer[] memory transfers = new BulkSend.TokenTransfer[](3);
        transfers[0] = BulkSend.TokenTransfer(alice, 100 ether);
        transfers[1] = BulkSend.TokenTransfer(bob, 200 ether);
        transfers[2] = BulkSend.TokenTransfer(charlie, 300 ether);

        bulkSend.sendTokenViaContract(address(token), transfers);

        assertEq(token.balanceOf(alice), 100 ether);
        assertEq(token.balanceOf(bob), 200 ether);
        assertEq(token.balanceOf(charlie), 300 ether);
        assertEq(token.balanceOf(address(bulkSend)), 0);
    }

    function test_sendTokenViaContract_revertsOnEmptyArray() public {
        BulkSend.TokenTransfer[] memory transfers = new BulkSend.TokenTransfer[](0);

        vm.expectRevert(BulkSend.EmptyArray.selector);
        bulkSend.sendTokenViaContract(address(token), transfers);
    }

    function test_sendTokenViaContract_revertsOnZeroAddress() public {
        BulkSend.TokenTransfer[] memory transfers = new BulkSend.TokenTransfer[](1);
        transfers[0] = BulkSend.TokenTransfer(address(0), 100 ether);

        vm.expectRevert(BulkSend.ZeroAddress.selector);
        bulkSend.sendTokenViaContract(address(token), transfers);
    }

    function test_sendTokenViaContract_revertsOnZeroAmount() public {
        BulkSend.TokenTransfer[] memory transfers = new BulkSend.TokenTransfer[](1);
        transfers[0] = BulkSend.TokenTransfer(alice, 0);

        vm.expectRevert(BulkSend.ZeroAmount.selector);
        bulkSend.sendTokenViaContract(address(token), transfers);
    }

    function test_sendTokenViaContract_revertsOnZeroTokenAddress() public {
        BulkSend.TokenTransfer[] memory transfers = new BulkSend.TokenTransfer[](1);
        transfers[0] = BulkSend.TokenTransfer(alice, 100 ether);

        vm.expectRevert(BulkSend.ZeroAddress.selector);
        bulkSend.sendTokenViaContract(address(0), transfers);
    }

    function test_sendTokenSameAmountViaContract_success() public {
        address[] memory recipients = new address[](3);
        recipients[0] = alice;
        recipients[1] = bob;
        recipients[2] = charlie;

        bulkSend.sendTokenSameAmountViaContract(address(token), recipients, 100 ether);

        assertEq(token.balanceOf(alice), 100 ether);
        assertEq(token.balanceOf(bob), 100 ether);
        assertEq(token.balanceOf(charlie), 100 ether);
        assertEq(token.balanceOf(address(bulkSend)), 0);
    }

    function test_sendTokenSameAmountViaContract_revertsOnEmptyArray() public {
        address[] memory recipients = new address[](0);

        vm.expectRevert(BulkSend.EmptyArray.selector);
        bulkSend.sendTokenSameAmountViaContract(address(token), recipients, 100 ether);
    }

    function test_sendTokenSameAmountViaContract_revertsOnZeroAmount() public {
        address[] memory recipients = new address[](1);
        recipients[0] = alice;

        vm.expectRevert(BulkSend.ZeroAmount.selector);
        bulkSend.sendTokenSameAmountViaContract(address(token), recipients, 0);
    }

    function test_sendTokenSameAmountViaContract_revertsOnZeroAddress() public {
        address[] memory recipients = new address[](1);
        recipients[0] = address(0);

        vm.expectRevert(BulkSend.ZeroAddress.selector);
        bulkSend.sendTokenSameAmountViaContract(address(token), recipients, 100 ether);
    }

    function test_sendTokenSameAmountViaContract_revertsOnZeroTokenAddress() public {
        address[] memory recipients = new address[](1);
        recipients[0] = alice;

        vm.expectRevert(BulkSend.ZeroAddress.selector);
        bulkSend.sendTokenSameAmountViaContract(address(0), recipients, 100 ether);
    }
}
