// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {BulkSend} from "../../contracts/evm/BulkSend.sol";
import {MockERC1155} from "../mocks/MockERC1155.sol";

contract SendERC1155Test is Test {
    BulkSend public bulkSend;
    MockERC1155 public nft;
    address public alice = makeAddr("alice");
    address public bob = makeAddr("bob");

    function setUp() public {
        bulkSend = new BulkSend();
        nft = new MockERC1155();

        // Mint some tokens
        nft.mint(address(this), 1, 100); // tokenId 1, amount 100
        nft.mint(address(this), 2, 100); // tokenId 2, amount 100

        nft.setApprovalForAll(address(bulkSend), true);
    }

    function onERC1155Received(address, address, uint256, uint256, bytes calldata) external pure returns (bytes4) {
        return this.onERC1155Received.selector;
    }

    function onERC1155BatchReceived(address, address, uint256[] calldata, uint256[] calldata, bytes calldata)
        external
        pure
        returns (bytes4)
    {
        return this.onERC1155BatchReceived.selector;
    }

    function test_sendERC1155_success() public {
        BulkSend.ERC1155Transfer[] memory transfers = new BulkSend.ERC1155Transfer[](2);
        transfers[0] = BulkSend.ERC1155Transfer(alice, 1, 10);
        transfers[1] = BulkSend.ERC1155Transfer(bob, 2, 20);

        bulkSend.sendERC1155(address(nft), transfers);

        assertEq(nft.balanceOf(alice, 1), 10);
        assertEq(nft.balanceOf(bob, 2), 20);
    }

    function test_sendERC1155_revertsOnEmptyArray() public {
        BulkSend.ERC1155Transfer[] memory transfers = new BulkSend.ERC1155Transfer[](0);

        vm.expectRevert(BulkSend.EmptyArray.selector);
        bulkSend.sendERC1155(address(nft), transfers);
    }

    function test_sendERC1155_revertsOnZeroAddress() public {
        BulkSend.ERC1155Transfer[] memory transfers = new BulkSend.ERC1155Transfer[](1);
        transfers[0] = BulkSend.ERC1155Transfer(address(0), 1, 10);

        vm.expectRevert(BulkSend.ZeroAddress.selector);
        bulkSend.sendERC1155(address(nft), transfers);
    }

    function test_sendERC1155_revertsOnZeroAmount() public {
        BulkSend.ERC1155Transfer[] memory transfers = new BulkSend.ERC1155Transfer[](1);
        transfers[0] = BulkSend.ERC1155Transfer(alice, 1, 0);

        vm.expectRevert(BulkSend.ZeroAmount.selector);
        bulkSend.sendERC1155(address(nft), transfers);
    }

    function test_sendERC1155_revertsOnZeroTokenAddress() public {
        BulkSend.ERC1155Transfer[] memory transfers = new BulkSend.ERC1155Transfer[](1);
        transfers[0] = BulkSend.ERC1155Transfer(alice, 1, 10);

        vm.expectRevert(BulkSend.ZeroAddress.selector);
        bulkSend.sendERC1155(address(0), transfers);
    }

    function test_sendERC1155SameToken_success() public {
        address[] memory recipients = new address[](2);
        recipients[0] = alice;
        recipients[1] = bob;

        bulkSend.sendERC1155SameToken(address(nft), recipients, 1, 10);

        assertEq(nft.balanceOf(alice, 1), 10);
        assertEq(nft.balanceOf(bob, 1), 10);
    }

    function test_sendERC1155SameToken_revertsOnEmptyArray() public {
        address[] memory recipients = new address[](0);

        vm.expectRevert(BulkSend.EmptyArray.selector);
        bulkSend.sendERC1155SameToken(address(nft), recipients, 1, 10);
    }

    function test_sendERC1155SameToken_revertsOnZeroAmount() public {
        address[] memory recipients = new address[](1);
        recipients[0] = alice;

        vm.expectRevert(BulkSend.ZeroAmount.selector);
        bulkSend.sendERC1155SameToken(address(nft), recipients, 1, 0);
    }
}
