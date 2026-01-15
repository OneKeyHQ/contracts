# BulkSend Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement a production-ready BulkSend contract with tests, deployment scripts, and configuration.

**Architecture:** Foundry-based EVM contract with TDD approach, separate Tron contract, React deployment app.

**Tech Stack:** Solidity 0.8.20, Foundry, OpenZeppelin, React, Vite, wagmi, TronWeb

---

## Phase 1: Project Setup

### Task 1: Initialize Foundry Project

**Files:**
- Create: `foundry.toml`
- Create: `.gitignore`
- Create: `.env.example`

**Step 1: Initialize Foundry and install dependencies**

Run: `forge init --no-commit && forge install OpenZeppelin/openzeppelin-contracts --no-commit`

**Step 2: Create foundry.toml**

```toml
[profile.default]
src = "contracts/evm"
out = "out"
libs = ["lib"]
solc = "0.8.20"
optimizer = true
optimizer_runs = 200

[profile.default.fmt]
line_length = 120
tab_width = 4

[rpc_endpoints]
ethereum = "${ETH_RPC_URL}"
bsc = "${BSC_RPC_URL}"
arbitrum = "${ARBITRUM_RPC_URL}"
polygon = "${POLYGON_RPC_URL}"
base = "${BASE_RPC_URL}"
optimism = "${OPTIMISM_RPC_URL}"
avalanche = "${AVALANCHE_RPC_URL}"
linea = "${LINEA_RPC_URL}"
zksync = "${ZKSYNC_RPC_URL}"

[etherscan]
ethereum = { key = "${ETHERSCAN_API_KEY}" }
bsc = { key = "${BSCSCAN_API_KEY}" }
arbitrum = { key = "${ARBISCAN_API_KEY}" }
polygon = { key = "${POLYGONSCAN_API_KEY}" }
base = { key = "${BASESCAN_API_KEY}" }
optimism = { key = "${OPSCAN_API_KEY}" }
avalanche = { key = "${SNOWTRACE_API_KEY}" }
linea = { key = "${LINEASCAN_API_KEY}" }
```

**Step 3: Create .gitignore**

```
out/
cache/
broadcast/
lib/
node_modules/
.env
.env.*
!.env.example
.idea/
.vscode/
.DS_Store
deploy-app/dist/
```

**Step 4: Create .env.example**

```bash
PRIVATE_KEY=
ETH_RPC_URL=https://eth.llamarpc.com
BSC_RPC_URL=https://bsc-dataseed.binance.org
ARBITRUM_RPC_URL=https://arb1.arbitrum.io/rpc
POLYGON_RPC_URL=https://polygon-rpc.com
BASE_RPC_URL=https://mainnet.base.org
OPTIMISM_RPC_URL=https://mainnet.optimism.io
AVALANCHE_RPC_URL=https://api.avax.network/ext/bc/C/rpc
LINEA_RPC_URL=https://rpc.linea.build
ZKSYNC_RPC_URL=https://mainnet.era.zksync.io
ETHERSCAN_API_KEY=
BSCSCAN_API_KEY=
ARBISCAN_API_KEY=
POLYGONSCAN_API_KEY=
BASESCAN_API_KEY=
OPSCAN_API_KEY=
SNOWTRACE_API_KEY=
LINEASCAN_API_KEY=
TRON_PRIVATE_KEY=
TRON_API_KEY=
```

**Step 5: Create directory structure**

Run: `mkdir -p contracts/evm contracts/tron test/unit test/mocks test/gas script config deployments/testnet deployments/mainnet`

**Step 6: Commit**

```bash
git add -A && git commit -m "chore: initialize foundry project structure"
```

---

## Phase 2: Mock Contracts (TDD Setup)

### Task 2: Create Mock ERC20

**Files:**
- Create: `test/mocks/MockERC20.sol`

**Step 1: Write MockERC20**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockERC20 is ERC20 {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
```

**Step 2: Commit**

```bash
git add test/mocks/MockERC20.sol && git commit -m "test: add MockERC20"
```

### Task 3: Create Mock ERC721

**Files:**
- Create: `test/mocks/MockERC721.sol`

**Step 1: Write MockERC721**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract MockERC721 is ERC721 {
    uint256 private _tokenIdCounter;

    constructor(string memory name, string memory symbol) ERC721(name, symbol) {}

    function mint(address to) external returns (uint256) {
        uint256 tokenId = _tokenIdCounter++;
        _mint(to, tokenId);
        return tokenId;
    }
}
```

**Step 2: Commit**

```bash
git add test/mocks/MockERC721.sol && git commit -m "test: add MockERC721"
```

### Task 4: Create Mock ERC1155

**Files:**
- Create: `test/mocks/MockERC1155.sol`

**Step 1: Write MockERC1155**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

contract MockERC1155 is ERC1155 {
    constructor() ERC1155("") {}

    function mint(address to, uint256 id, uint256 amount) external {
        _mint(to, id, amount, "");
    }
}
```

**Step 2: Commit**

```bash
git add test/mocks/MockERC1155.sol && git commit -m "test: add MockERC1155"
```

---

## Phase 3: BulkSend Contract (TDD)

### Task 5: Write SendNative Tests

**Files:**
- Create: `test/unit/SendNative.t.sol`
- Create: `contracts/evm/BulkSend.sol` (minimal)

**Step 1: Write failing test for sendNative**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {BulkSend} from "../../contracts/evm/BulkSend.sol";

contract SendNativeTest is Test {
    BulkSend public bulkSend;
    address public alice = makeAddr("alice");
    address public bob = makeAddr("bob");

    function setUp() public {
        bulkSend = new BulkSend();
        vm.deal(address(this), 100 ether);
    }

    function test_sendNative_success() public {
        BulkSend.TokenTransfer[] memory transfers = new BulkSend.TokenTransfer[](2);
        transfers[0] = BulkSend.TokenTransfer(alice, 1 ether);
        transfers[1] = BulkSend.TokenTransfer(bob, 2 ether);

        bulkSend.sendNative{value: 3 ether}(transfers);

        assertEq(alice.balance, 1 ether);
        assertEq(bob.balance, 2 ether);
    }

    function test_sendNative_refundsExcess() public {
        BulkSend.TokenTransfer[] memory transfers = new BulkSend.TokenTransfer[](1);
        transfers[0] = BulkSend.TokenTransfer(alice, 1 ether);

        uint256 balanceBefore = address(this).balance;
        bulkSend.sendNative{value: 2 ether}(transfers);

        assertEq(alice.balance, 1 ether);
        assertEq(address(this).balance, balanceBefore - 1 ether);
    }

    function test_sendNative_revertsOnInsufficientValue() public {
        BulkSend.TokenTransfer[] memory transfers = new BulkSend.TokenTransfer[](1);
        transfers[0] = BulkSend.TokenTransfer(alice, 1 ether);

        vm.expectRevert(BulkSend.InsufficientValue.selector);
        bulkSend.sendNative{value: 0.5 ether}(transfers);
    }

    function test_sendNative_revertsOnEmptyArray() public {
        BulkSend.TokenTransfer[] memory transfers = new BulkSend.TokenTransfer[](0);

        vm.expectRevert(BulkSend.EmptyArray.selector);
        bulkSend.sendNative{value: 1 ether}(transfers);
    }

    function test_sendNative_revertsOnZeroAddress() public {
        BulkSend.TokenTransfer[] memory transfers = new BulkSend.TokenTransfer[](1);
        transfers[0] = BulkSend.TokenTransfer(address(0), 1 ether);

        vm.expectRevert(BulkSend.ZeroAddress.selector);
        bulkSend.sendNative{value: 1 ether}(transfers);
    }

    function test_sendNative_revertsOnZeroAmount() public {
        BulkSend.TokenTransfer[] memory transfers = new BulkSend.TokenTransfer[](1);
        transfers[0] = BulkSend.TokenTransfer(alice, 0);

        vm.expectRevert(BulkSend.ZeroAmount.selector);
        bulkSend.sendNative{value: 1 ether}(transfers);
    }

    receive() external payable {}
}
```

**Step 2: Run test to verify it fails**

Run: `forge test --match-contract SendNativeTest -vvv`
Expected: Compilation error (BulkSend not found)

**Step 3: Write minimal BulkSend to make tests pass**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract BulkSend is Ownable, ReentrancyGuard {
    struct TokenTransfer {
        address recipient;
        uint256 amount;
    }

    error EmptyArray();
    error ZeroAddress();
    error ZeroAmount();
    error InsufficientValue();
    error RefundFailed();
    error TransferFailed();

    event NativeSent(address indexed from, address indexed to, uint256 amount);

    constructor() Ownable(msg.sender) {}

    function sendNative(TokenTransfer[] calldata transfers) external payable nonReentrant {
        uint256 len = transfers.length;
        if (len == 0) revert EmptyArray();

        uint256 total;
        for (uint256 i; i < len; ) {
            if (transfers[i].recipient == address(0)) revert ZeroAddress();
            if (transfers[i].amount == 0) revert ZeroAmount();
            total += transfers[i].amount;
            unchecked { ++i; }
        }

        if (msg.value < total) revert InsufficientValue();

        for (uint256 i; i < len; ) {
            (bool success, ) = transfers[i].recipient.call{value: transfers[i].amount}("");
            if (!success) revert TransferFailed();
            emit NativeSent(msg.sender, transfers[i].recipient, transfers[i].amount);
            unchecked { ++i; }
        }

        uint256 remaining = msg.value - total;
        if (remaining > 0) {
            (bool success, ) = msg.sender.call{value: remaining}("");
            if (!success) revert RefundFailed();
        }
    }
}
```

**Step 4: Run tests to verify they pass**

Run: `forge test --match-contract SendNativeTest -vvv`
Expected: All tests pass

**Step 5: Commit**

```bash
git add -A && git commit -m "feat: implement sendNative with tests"
```

### Task 6: Implement sendNativeSameAmount

**Files:**
- Modify: `contracts/evm/BulkSend.sol`
- Create: `test/unit/SendNativeSameAmount.t.sol`

**Step 1: Write failing test**

```solidity
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

    receive() external payable {}
}
```

**Step 2: Implement sendNativeSameAmount**

Add to BulkSend.sol:

```solidity
function sendNativeSameAmount(address[] calldata recipients, uint256 amount) external payable nonReentrant {
    uint256 len = recipients.length;
    if (len == 0) revert EmptyArray();
    if (amount == 0) revert ZeroAmount();

    uint256 total = len * amount;
    if (msg.value < total) revert InsufficientValue();

    for (uint256 i; i < len; ) {
        if (recipients[i] == address(0)) revert ZeroAddress();
        (bool success, ) = recipients[i].call{value: amount}("");
        if (!success) revert TransferFailed();
        emit NativeSent(msg.sender, recipients[i], amount);
        unchecked { ++i; }
    }

    uint256 remaining = msg.value - total;
    if (remaining > 0) {
        (bool success, ) = msg.sender.call{value: remaining}("");
        if (!success) revert RefundFailed();
    }
}
```

**Step 3: Run tests**

Run: `forge test --match-contract SendNativeSameAmountTest -vvv`

**Step 4: Commit**

```bash
git add -A && git commit -m "feat: implement sendNativeSameAmount"
```

### Task 7-12: Implement remaining functions (same TDD pattern)

Follow the same TDD pattern for:
- Task 7: sendToken + sendTokenSameAmount
- Task 8: sendERC721
- Task 9: sendERC1155 + sendERC1155SameToken
- Task 10: withdrawStuckNative
- Task 11: withdrawStuckToken
- Task 12: withdrawStuckERC721 + withdrawStuckERC1155

Each task follows:
1. Write failing test
2. Run test to verify failure
3. Implement minimal code
4. Run test to verify pass
5. Commit

---

## Phase 4: Deployment Scripts

### Task 13: Create Foundry Deploy Script

**Files:**
- Create: `script/Deploy.s.sol`

**Step 1: Write deploy script**

```solidity
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
```

**Step 2: Commit**

```bash
git add script/Deploy.s.sol && git commit -m "feat: add foundry deploy script"
```

---

## Phase 5: Configuration Files

### Task 14: Create Chain Configuration

**Files:**
- Create: `config/chains.json`
- Create: `config/testnet.json`
- Create: `config/mainnet.json`

(Content as specified in design document)

**Commit after each file**

---

## Phase 6: Tron Contract

### Task 15: Create Tron BulkSend

**Files:**
- Create: `contracts/tron/BulkSend.sol`

Same logic as EVM version but with:
- Manual Ownable implementation
- TRX/TRC naming
- No OpenZeppelin imports

---

## Phase 7: Gas Benchmarks

### Task 16: Create Gas Benchmark Tests

**Files:**
- Create: `test/gas/GasBenchmark.t.sol`

Test gas consumption for 10, 50, 100 recipients.

---

## Phase 8: CI/CD

### Task 17: Create GitHub Actions Workflow

**Files:**
- Create: `.github/workflows/test.yml`

---

## Phase 9: Documentation

### Task 18: Create CLAUDE.md

**Files:**
- Create: `CLAUDE.md`

Include build commands, test commands, architecture overview.

---

## Execution Notes

- Each task is atomic and can be committed independently
- Run `forge test` after each implementation to ensure no regressions
- Run `forge fmt` before each commit
- Use `forge snapshot` to track gas changes
