// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Test.sol";

import "../contracts/Disperse.sol";

import {Utilities} from "./utils/Utilities.sol";
import {MockERC20} from "solmate/test/utils/mocks/MockERC20.sol";
import {MockERC721} from "solmate/test/utils/mocks/MockERC721.sol";
import {MockERC1155} from "solmate/test/utils/mocks/MockERC1155.sol";

contract DisperseTest is Test {
    Disperse public disperse;

    MockERC20 public token;
    MockERC721 public nft_1;
    MockERC721 public nft_2;
    MockERC1155 public nft1155_1;
    MockERC1155 public nft1155_2;

    Utilities internal utils;
    address[] internal users;

    function setUp() public {
        utils = new Utilities();
        disperse = new Disperse();

        token = new MockERC20("Token", "TKN", 18);
        nft_1 = new MockERC721("NFT1", "NFT1");
        nft_2 = new MockERC721("NFT2", "NFT2");
        nft1155_1 = new MockERC1155();
        nft1155_2 = new MockERC1155();

        users = utils.createUsers(5);

        token.mint(address(this), 10000 ether);

        for (uint256 i = 0; i < 5; i++) {
            nft_1.mint(address(this), i);
            nft_2.mint(address(this), i);
        }

        uint256[] memory ids = new uint256[](3);
        ids[0] = 0;
        ids[1] = 1;
        ids[2] = 2;
        uint256[] memory amounts = new uint256[](3);
        amounts[0] = 10;
        amounts[1] = 10;
        amounts[2] = 10;

        nft1155_1.batchMint(address(this), ids, amounts, "");
        nft1155_2.batchMint(address(this), ids, amounts, "");

        vm.startPrank(address(this));
        token.approve(address(disperse), 10000 ether);
        nft_1.setApprovalForAll(address(disperse), true);
        nft_2.setApprovalForAll(address(disperse), true);
        nft1155_1.setApprovalForAll(address(disperse), true);
        nft1155_2.setApprovalForAll(address(disperse), true);
    }

    function testDisperseNFT_721() public {
        IERC721_IERC1155[] memory tokens = new IERC721_IERC1155[](2);
        tokens[0] = IERC721_IERC1155(address(nft_1));
        tokens[1] = IERC721_IERC1155(address(nft_1));

        uint256[] memory tokenIds = new uint256[](2);
        tokenIds[0] = 1;
        tokenIds[1] = 2;

        uint256[] memory amounts = new uint256[](2);
        amounts[0] = 0;
        amounts[1] = 0;

        disperse.disperseNFT(address(1), tokens, tokenIds, amounts);

        assertEq(nft_1.ownerOf(1), address(1));
        assertEq(nft_1.ownerOf(2), address(1));
    }

    function testDisperseNFT_1155() public {
        IERC721_IERC1155[] memory tokens = new IERC721_IERC1155[](2);
        tokens[0] = IERC721_IERC1155(address(nft1155_1));
        tokens[1] = IERC721_IERC1155(address(nft1155_1));

        uint256[] memory tokenIds = new uint256[](2);
        tokenIds[0] = 1;
        tokenIds[1] = 2;

        uint256[] memory amounts = new uint256[](2);
        amounts[0] = 5;
        amounts[1] = 5;

        disperse.disperseNFT(address(1), tokens, tokenIds, amounts);

        assertEq(nft1155_1.balanceOf(address(1), 1), 5);
        assertEq(nft1155_1.balanceOf(address(1), 2), 5);
    }

    function testDisperseEther() public {
        vm.deal(address(this), 100 ether);

        uint256[] memory values = new uint256[](5);
        values[0] = 1 ether;
        values[1] = 2 ether;
        values[2] = 3 ether;
        values[3] = 4 ether;
        values[4] = 5 ether;

        disperse.disperseEther{value: 15 ether}(users, values);

        assertEq(users[0].balance, 101 ether); // default balance is 100
        assertEq(users[1].balance, 102 ether);
        assertEq(users[2].balance, 103 ether);
        assertEq(users[3].balance, 104 ether);
        assertEq(users[4].balance, 105 ether);
    }

    function testDisperseToken() public {
        uint256[] memory values = new uint256[](5);
        values[0] = 1 ether;
        values[1] = 2 ether;
        values[2] = 3 ether;
        values[3] = 4 ether;
        values[4] = 5 ether;

        disperse.disperseToken(IERC20(address(token)), users, values);

        assertEq(token.balanceOf(users[0]), 1 ether);
        assertEq(token.balanceOf(users[1]), 2 ether);
        assertEq(token.balanceOf(users[2]), 3 ether);
        assertEq(token.balanceOf(users[3]), 4 ether);
        assertEq(token.balanceOf(users[4]), 5 ether);
    }

    function testDisperseTokenSimple() public {
        uint256[] memory values = new uint256[](5);
        values[0] = 1 ether;
        values[1] = 2 ether;
        values[2] = 3 ether;
        values[3] = 4 ether;
        values[4] = 5 ether;
        disperse.disperseTokenSimple(IERC20(address(token)), users, values);

        assertEq(token.balanceOf(users[0]), 1 ether);
        assertEq(token.balanceOf(users[1]), 2 ether);
        assertEq(token.balanceOf(users[2]), 3 ether);
        assertEq(token.balanceOf(users[3]), 4 ether);
        assertEq(token.balanceOf(users[4]), 5 ether);
    }

    function testDisperseEtherSameValue() public {
        vm.deal(address(this), 100 ether);

        disperse.disperseEtherSameValue{value: 15 ether}(users, 3 ether);

        assertEq(users[0].balance, 103 ether); // default balance is 100
        assertEq(users[1].balance, 103 ether);
        assertEq(users[2].balance, 103 ether);
        assertEq(users[3].balance, 103 ether);
        assertEq(users[4].balance, 103 ether);
    }

    function testDisperseTokenSameValue() public {
        disperse.disperseTokenSameValue(IERC20(address(token)), users, 3 ether);

        assertEq(token.balanceOf(users[0]), 3 ether);
        assertEq(token.balanceOf(users[1]), 3 ether);
        assertEq(token.balanceOf(users[2]), 3 ether);
        assertEq(token.balanceOf(users[3]), 3 ether);
        assertEq(token.balanceOf(users[4]), 3 ether);
    }

    function testWithdraw() public {
        vm.deal(address(this), 100 ether);

        token.transfer(address(disperse), 100 ether);

        disperse.withdraw(IERC20(address(token)), address(1));

        assertEq(token.balanceOf(address(disperse)), 0 ether);
        assertEq(token.balanceOf(address(1)), 100 ether);
    }

    function testWithdrawNFT() public {
        nft_1.mint(address(disperse), 100);

        assertEq(nft_1.ownerOf(100), address(disperse));

        disperse.withdrawNFT(address(1), IERC721_IERC1155(address(nft_1)), 100, 0);

        assertEq(nft_1.ownerOf(100), address(1));
    }

    function onERC1155Received(address, address, uint256, uint256, bytes memory) public virtual returns (bytes4) {
        return this.onERC1155Received.selector;
    }

    function onERC1155BatchReceived(address, address, uint256[] memory, uint256[] memory, bytes memory)
        public
        virtual
        returns (bytes4)
    {
        return this.onERC1155BatchReceived.selector;
    }
}
