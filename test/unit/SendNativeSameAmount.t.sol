// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {BulkSend} from "../../contracts/evm/BulkSend.sol";

contract SendNativeSameAmountTest is Test {
    BulkSend public bulkSend;
    address public alice = makeAddr("alice");
    address public bob = makeAddr("bob");

    function setUp() public {
        bulkSend = new BulkSend();
        vm.deal(address(this), 100 ether);
    }

    function test_sendNativeSameAmount_success() public {
        address[] memory recipients = new address[](2);
        recipients[0] = alice;
        recipients[1] = bob;

        bulkSend.sendNativeSameAmount{value: 2 ether}(recipients, 1 ether);

        assertEq(alice.balance, 1 ether);
        assertEq(bob.balance, 1 ether);
    }

    function test_sendNativeSameAmount_refundsExcess() public {
        address[] memory recipients = new address[](1);
        recipients[0] = alice;

        uint256 balanceBefore = address(this).balance;
        bulkSend.sendNativeSameAmount{value: 2 ether}(recipients, 1 ether);

        assertEq(alice.balance, 1 ether);
        assertEq(address(this).balance, balanceBefore - 1 ether);
    }

    function test_sendNativeSameAmount_revertsOnInsufficientValue() public {
        address[] memory recipients = new address[](2);
        recipients[0] = alice;
        recipients[1] = bob;

        vm.expectRevert(BulkSend.InsufficientValue.selector);
        bulkSend.sendNativeSameAmount{value: 1 ether}(recipients, 1 ether);
    }

    function test_sendNativeSameAmount_revertsOnEmptyArray() public {
        address[] memory recipients = new address[](0);

        vm.expectRevert(BulkSend.EmptyArray.selector);
        bulkSend.sendNativeSameAmount{value: 1 ether}(recipients, 1 ether);
    }

    function test_sendNativeSameAmount_revertsOnZeroAddress() public {
        address[] memory recipients = new address[](1);
        recipients[0] = address(0);

        vm.expectRevert(BulkSend.ZeroAddress.selector);
        bulkSend.sendNativeSameAmount{value: 1 ether}(recipients, 1 ether);
    }

    function test_sendNativeSameAmount_revertsOnZeroAmount() public {
        address[] memory recipients = new address[](1);
        recipients[0] = alice;

        vm.expectRevert(BulkSend.ZeroAmount.selector);
        bulkSend.sendNativeSameAmount{value: 1 ether}(recipients, 0);
    }

    receive() external payable {}
}
