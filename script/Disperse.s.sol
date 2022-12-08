// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Script.sol";

import "../contracts/Disperse.sol";

contract DisperseScript is Script {
    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        address disperseContract = address(new Disperse());
        console.log("disperseContract:", disperseContract);

        vm.stopBroadcast();
    }
}
