// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {BulkSend} from "../contracts/evm/BulkSend.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        BulkSend bulkSend = new BulkSend();
        console.log("BulkSend deployed at:", address(bulkSend));

        vm.stopBroadcast();
    }
}
