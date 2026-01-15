// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {BulkSend} from "../../contracts/evm/BulkSend.sol";
import {MockERC20} from "../mocks/MockERC20.sol";

contract GasBenchmarkTest is Test {
    BulkSend public bulkSend;
    MockERC20 public token;

    function setUp() public {
        bulkSend = new BulkSend();
        token = new MockERC20("Test", "TST");
        vm.deal(address(this), 1000 ether);
        token.mint(address(this), 1000000 ether);
        token.approve(address(bulkSend), type(uint256).max);
    }

    function _createRecipients(uint256 count) internal pure returns (address[] memory) {
        address[] memory recipients = new address[](count);
        for (uint256 i = 0; i < count; i++) {
            recipients[i] = address(uint160(0x1000 + i));
        }
        return recipients;
    }

    function _createTransfers(uint256 count) internal pure returns (BulkSend.TokenTransfer[] memory) {
        BulkSend.TokenTransfer[] memory transfers = new BulkSend.TokenTransfer[](count);
        for (uint256 i = 0; i < count; i++) {
            transfers[i] = BulkSend.TokenTransfer(address(uint160(0x1000 + i)), 1 ether);
        }
        return transfers;
    }

    // sendNative benchmarks
    function test_gas_sendNative_10() public {
        BulkSend.TokenTransfer[] memory transfers = _createTransfers(10);
        bulkSend.sendNative{value: 10 ether}(transfers);
    }

    function test_gas_sendNative_50() public {
        BulkSend.TokenTransfer[] memory transfers = _createTransfers(50);
        bulkSend.sendNative{value: 50 ether}(transfers);
    }

    function test_gas_sendNative_100() public {
        BulkSend.TokenTransfer[] memory transfers = _createTransfers(100);
        bulkSend.sendNative{value: 100 ether}(transfers);
    }

    // sendNativeSameAmount benchmarks
    function test_gas_sendNativeSameAmount_10() public {
        address[] memory recipients = _createRecipients(10);
        bulkSend.sendNativeSameAmount{value: 10 ether}(recipients, 1 ether);
    }

    function test_gas_sendNativeSameAmount_50() public {
        address[] memory recipients = _createRecipients(50);
        bulkSend.sendNativeSameAmount{value: 50 ether}(recipients, 1 ether);
    }

    function test_gas_sendNativeSameAmount_100() public {
        address[] memory recipients = _createRecipients(100);
        bulkSend.sendNativeSameAmount{value: 100 ether}(recipients, 1 ether);
    }

    // sendToken benchmarks
    function test_gas_sendToken_10() public {
        BulkSend.TokenTransfer[] memory transfers = _createTransfers(10);
        bulkSend.sendToken(address(token), transfers);
    }

    function test_gas_sendToken_50() public {
        BulkSend.TokenTransfer[] memory transfers = _createTransfers(50);
        bulkSend.sendToken(address(token), transfers);
    }

    function test_gas_sendToken_100() public {
        BulkSend.TokenTransfer[] memory transfers = _createTransfers(100);
        bulkSend.sendToken(address(token), transfers);
    }

    // sendTokenSameAmount benchmarks
    function test_gas_sendTokenSameAmount_10() public {
        address[] memory recipients = _createRecipients(10);
        bulkSend.sendTokenSameAmount(address(token), recipients, 1 ether);
    }

    function test_gas_sendTokenSameAmount_50() public {
        address[] memory recipients = _createRecipients(50);
        bulkSend.sendTokenSameAmount(address(token), recipients, 1 ether);
    }

    function test_gas_sendTokenSameAmount_100() public {
        address[] memory recipients = _createRecipients(100);
        bulkSend.sendTokenSameAmount(address(token), recipients, 1 ether);
    }

    receive() external payable {}
}
