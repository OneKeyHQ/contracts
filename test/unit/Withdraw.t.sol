// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {BulkSend} from "../../contracts/evm/BulkSend.sol";
import {MockERC20} from "../mocks/MockERC20.sol";
import {MockERC721} from "../mocks/MockERC721.sol";
import {MockERC1155} from "../mocks/MockERC1155.sol";

contract WithdrawTest is Test {
    BulkSend public bulkSend;
    MockERC20 public token;
    MockERC721 public nft;
    MockERC1155 public multiToken;
    address public owner;
    address public alice = makeAddr("alice");

    function onERC1155Received(address, address, uint256, uint256, bytes calldata) external pure returns (bytes4) {
        return this.onERC1155Received.selector;
    }

    function setUp() public {
        owner = address(this);
        bulkSend = new BulkSend();
        vm.deal(address(bulkSend), 10 ether);
        token = new MockERC20("Test", "TST");
        token.mint(address(bulkSend), 1000e18);
        nft = new MockERC721("TestNFT", "TNFT");
        nft.mint(address(bulkSend));
        multiToken = new MockERC1155();
        multiToken.mint(address(bulkSend), 1, 100);
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

    // ERC721 withdraw tests
    function test_withdrawStuckERC721_success() public {
        assertEq(nft.ownerOf(0), address(bulkSend));
        bulkSend.withdrawStuckERC721(address(nft), alice, 0);
        assertEq(nft.ownerOf(0), alice);
    }

    function test_withdrawStuckERC721_revertsOnNonOwner() public {
        vm.prank(alice);
        vm.expectRevert();
        bulkSend.withdrawStuckERC721(address(nft), alice, 0);
    }

    function test_withdrawStuckERC721_revertsOnZeroTokenAddress() public {
        vm.expectRevert(BulkSend.ZeroAddress.selector);
        bulkSend.withdrawStuckERC721(address(0), alice, 0);
    }

    function test_withdrawStuckERC721_revertsOnZeroRecipientAddress() public {
        vm.expectRevert(BulkSend.ZeroAddress.selector);
        bulkSend.withdrawStuckERC721(address(nft), address(0), 0);
    }

    // ERC1155 withdraw tests
    function test_withdrawStuckERC1155_success() public {
        assertEq(multiToken.balanceOf(address(bulkSend), 1), 100);
        bulkSend.withdrawStuckERC1155(address(multiToken), alice, 1, 100);
        assertEq(multiToken.balanceOf(alice, 1), 100);
        assertEq(multiToken.balanceOf(address(bulkSend), 1), 0);
    }

    function test_withdrawStuckERC1155_revertsOnNonOwner() public {
        vm.prank(alice);
        vm.expectRevert();
        bulkSend.withdrawStuckERC1155(address(multiToken), alice, 1, 100);
    }

    function test_withdrawStuckERC1155_revertsOnZeroTokenAddress() public {
        vm.expectRevert(BulkSend.ZeroAddress.selector);
        bulkSend.withdrawStuckERC1155(address(0), alice, 1, 100);
    }

    function test_withdrawStuckERC1155_revertsOnZeroRecipientAddress() public {
        vm.expectRevert(BulkSend.ZeroAddress.selector);
        bulkSend.withdrawStuckERC1155(address(multiToken), address(0), 1, 100);
    }

    function test_withdrawStuckERC1155_revertsOnZeroAmount() public {
        vm.expectRevert(BulkSend.ZeroAmount.selector);
        bulkSend.withdrawStuckERC1155(address(multiToken), alice, 1, 0);
    }
}
