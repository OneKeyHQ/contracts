// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "../contracts/Disperse.sol";

import {MockERC721} from "solmate/test/utils/mocks/MockERC721.sol";

contract CounterTest is Test {
    Disperse public disperse;


    function setUp() public {
        disperse = new Disperse();

    }

    function testDisperseNFT() public {
    }
    function disperseNFT(
        address recipient,
        IERC721_IERC1155[] calldata tokens,
        uint256[] calldata tokenIds,
        uint256[] calldata amounts,
        bytes calldata data
    )
        external
    {}

    function testDisperseEther() public {
        // TODO
    }
    function disperseEther(address[] memory recipients, uint256[] memory values) external payable {}

    function testDisperseToken() public {
        // TODO
    }
    function disperseToken(IERC20 token, address[] memory recipients, uint256[] memory values) external {}

    function testDisperseEtherSimple() public {
        // TODO
    }
    function disperseTokenSimple(IERC20 token, address[] memory recipients, uint256[] memory values) external {}

    function testDisperseEtherSameValue() public {
        // TODO
    }
    function disperseEtherSameValue(address[] memory recipients, uint256 value) external payable {}

    function testDisperseTokenSameValue() public {
        // TODO
    }
    function disperseTokenSameValue(IERC20 token, address[] memory recipients, uint256 value) external {}
}
