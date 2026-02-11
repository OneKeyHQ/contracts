// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {BulkSend} from "../../contracts/evm/BulkSend.sol";
import {MockERC721} from "../mocks/MockERC721.sol";

contract SendERC721Test is Test {
    BulkSend public bulkSend;
    MockERC721 public nft;
    address public alice = makeAddr("alice");
    address public bob = makeAddr("bob");

    function setUp() public {
        bulkSend = new BulkSend();
        nft = new MockERC721("Test NFT", "TNFT");

        // Mint some NFTs
        nft.mint(address(this)); // tokenId 0
        nft.mint(address(this)); // tokenId 1
        nft.mint(address(this)); // tokenId 2

        nft.setApprovalForAll(address(bulkSend), true);
    }

    function test_sendERC721_success() public {
        BulkSend.ERC721Transfer[] memory transfers = new BulkSend.ERC721Transfer[](2);
        transfers[0] = BulkSend.ERC721Transfer(alice, 0);
        transfers[1] = BulkSend.ERC721Transfer(bob, 1);

        bulkSend.sendERC721(address(nft), transfers);

        assertEq(nft.ownerOf(0), alice);
        assertEq(nft.ownerOf(1), bob);
    }

    function test_sendERC721_revertsOnEmptyArray() public {
        BulkSend.ERC721Transfer[] memory transfers = new BulkSend.ERC721Transfer[](0);

        vm.expectRevert(BulkSend.EmptyArray.selector);
        bulkSend.sendERC721(address(nft), transfers);
    }

    function test_sendERC721_revertsOnZeroAddress() public {
        BulkSend.ERC721Transfer[] memory transfers = new BulkSend.ERC721Transfer[](1);
        transfers[0] = BulkSend.ERC721Transfer(address(0), 0);

        vm.expectRevert(BulkSend.ZeroAddress.selector);
        bulkSend.sendERC721(address(nft), transfers);
    }

    function test_sendERC721_revertsOnZeroTokenAddress() public {
        BulkSend.ERC721Transfer[] memory transfers = new BulkSend.ERC721Transfer[](1);
        transfers[0] = BulkSend.ERC721Transfer(alice, 0);

        vm.expectRevert(BulkSend.ZeroAddress.selector);
        bulkSend.sendERC721(address(0), transfers);
    }
}
