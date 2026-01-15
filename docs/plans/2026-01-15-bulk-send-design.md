# BulkSend 合约设计文档

> 创建日期: 2026-01-15

## 概述

BulkSend 是一个免费的公共批量发送合约服务，支持批量发送原生代币、ERC20 代币和 NFT。用户通过 Web 界面连接钱包使用。

## 核心决策

| 决策点 | 选择 | 理由 |
|--------|------|------|
| 费用模式 | 免费 | 公共服务 |
| 合约架构 | 非代理，最小 Owner 权限 | 仅保留误转资产提取功能 |
| 失败语义 | 原子性 | 全部成功或全部失败，用户预期一致 |
| 参数格式 | 结构体数组 | 避免数组长度不匹配风险 |
| Gas 优化 | 常规优化，不用 assembly | 保持可读性和安全性 |
| 部署方式 | 普通部署 | 每条链地址不同，通过文档记录 |
| 环境区分 | 配置文件 + 命令行参数 | 灵活组合 |

## 支持的链

**P0 (优先)**
- Ethereum
- BNB Chain
- Tron (TVM)

**P1**
- Arbitrum One
- Polygon
- Base

**P2**
- Optimism
- Avalanche
- Linea
- zkSync Era

## 合约设计

### EVM 版本 (contracts/evm/BulkSend.sol)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {SafeERC20, IERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract BulkSend is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ===== 结构体 =====
    struct TokenTransfer {
        address recipient;
        uint256 amount;
    }

    struct ERC721Transfer {
        address recipient;
        uint256 tokenId;
    }

    struct ERC1155Transfer {
        address recipient;
        uint256 tokenId;
        uint256 amount;
    }

    // ===== Custom Errors =====
    error EmptyArray();
    error LengthMismatch();
    error ZeroAddress();
    error ZeroAmount();
    error InsufficientValue();
    error RefundFailed();
    error TransferFailed();

    // ===== Events =====
    event NativeSent(address indexed from, address indexed to, uint256 amount);
    event TokenSent(address indexed token, address indexed from, address indexed to, uint256 amount);
    event ERC721Sent(address indexed token, address indexed from, address indexed to, uint256 tokenId);
    event ERC1155Sent(address indexed token, address indexed from, address indexed to, uint256 tokenId, uint256 amount);

    // ===== 原生代币 =====
    function sendNative(TokenTransfer[] calldata transfers) external payable nonReentrant;
    function sendNativeSameAmount(address[] calldata recipients, uint256 amount) external payable nonReentrant;

    // ===== ERC20 代币 =====
    function sendToken(address token, TokenTransfer[] calldata transfers) external nonReentrant;
    function sendTokenSameAmount(address token, address[] calldata recipients, uint256 amount) external nonReentrant;

    // ===== ERC721 =====
    function sendERC721(address token, ERC721Transfer[] calldata transfers) external nonReentrant;

    // ===== ERC1155 =====
    function sendERC1155(address token, ERC1155Transfer[] calldata transfers) external nonReentrant;
    function sendERC1155SameToken(address token, address[] calldata recipients, uint256 tokenId, uint256 amount) external nonReentrant;

    // ===== 紧急功能 (仅 Owner) =====
    function withdrawStuckNative(address to) external onlyOwner;
    function withdrawStuckToken(address token, address to) external onlyOwner;
    function withdrawStuckERC721(address token, address to, uint256 tokenId) external onlyOwner;
    function withdrawStuckERC1155(address token, address to, uint256 tokenId, uint256 amount) external onlyOwner;
}
```

### 实现要点

| 功能 | 实现细节 |
|------|----------|
| Native 金额校验 | `msg.value >= total`，多余自动退款 |
| ERC20 转账 | 直接 `safeTransferFrom` 到接收者，省 gas |
| ERC721 转账 | 使用 `transferFrom`（非 safe），避免恶意接收者阻塞 |
| ERC1155 转账 | 使用 `safeTransferFrom`，标准要求 |
| 重入保护 | 所有函数加 `nonReentrant` |
| 错误处理 | Custom errors，省 gas |

### 输入校验

每个函数必须检查：
- `transfers.length > 0` / `recipients.length > 0`
- `token != address(0)`（ERC20/NFT 函数）
- `recipient != address(0)`（循环内）
- `amount > 0`（ERC20/ERC1155/Native）

### 不支持的场景

- Fee-on-transfer 代币（实际到账金额可能与 amount 不一致）
- Rebasing 代币

## Tron 版本 (contracts/tron/BulkSend.sol)

与 EVM 版本接口一致，主要差异：

| 项目 | EVM 版本 | Tron 版本 |
|------|----------|-----------|
| 继承 | OpenZeppelin | 手动实现（减少依赖） |
| 事件名 | NativeSent, TokenSent | TRXSent, TRC20Sent |
| 结构体名 | ERC721Transfer | TRC721Transfer |
| 函数名 | sendNative, sendToken | sendTRX, sendTRC20 |

## 项目结构

```
contracts/
├── contracts/
│   ├── evm/
│   │   ├── BulkSend.sol
│   │   └── interfaces/
│   │       ├── IERC721.sol
│   │       └── IERC1155.sol
│   └── tron/
│       └── BulkSend.sol
├── script/
│   ├── Deploy.s.sol
│   └── deploy-tron.js
├── test/
│   ├── unit/
│   │   ├── SendNative.t.sol
│   │   ├── SendToken.t.sol
│   │   ├── SendERC721.t.sol
│   │   ├── SendERC1155.t.sol
│   │   └── Withdraw.t.sol
│   ├── integration/
│   │   └── FullFlow.t.sol
│   ├── gas/
│   │   └── GasBenchmark.t.sol
│   └── mocks/
│       ├── MockERC20.sol
│       ├── MockERC721.sol
│       ├── MockERC1155.sol
│       └── MockMaliciousReceiver.sol
├── deploy-app/
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── config/
│   │   └── utils/
│   ├── package.json
│   └── vite.config.ts
├── config/
│   ├── chains.json
│   ├── testnet.json
│   └── mainnet.json
├── deployments/                  # 自动生成，禁止手动修改
│   ├── testnet/
│   │   ├── deployments.json
│   │   └── README.md
│   └── mainnet/
│       ├── deployments.json
│       └── README.md
├── .github/
│   └── workflows/
│       └── test.yml
├── foundry.toml
├── .gitignore
├── .env.example
├── CLAUDE.md
└── README.md
```

## 部署架构

### 配置文件

**config/chains.json** - 链基础配置（chainId, rpc, explorer 等）

**config/testnet.json** / **config/mainnet.json** - 环境链列表

### 部署流程

1. 预检查：读取环境配置，检查钱包余额，检查是否已部署
2. 部署合约：部署 BulkSend，等待确认，验证源码
3. 更新记录：写入 `deployments/{env}/deployments.json`，生成 `README.md`

### 部署记录格式

**deployments.json:**
```json
{
  "generatedAt": "2026-01-15T10:30:00Z",
  "contracts": {
    "ethereum": {
      "address": "0x...",
      "deployer": "0x...",
      "deployedAt": "2026-01-15T10:30:00Z",
      "txHash": "0x...",
      "blockNumber": 12345678,
      "gasUsed": "456789",
      "verified": true
    }
  }
}
```

## 部署前端 (deploy-app)

### 技术栈

- React + Vite
- wagmi + viem（EVM 钱包）
- TronWeb + TronLink（Tron 钱包）
- Tailwind CSS

### 核心功能

1. 连接钱包 → 检测当前网络
2. 选择目标链 → 自动检查每条链的余额
3. 余额不足 → 显示警告，禁用该链的部署
4. 点击部署 → 逐链部署
5. 部署完成 → 自动更新部署记录
6. 下载报告 → 导出部署结果

## 测试策略

### 测试分层

- **unit/**: 单元测试（各函数正常/异常场景）
- **integration/**: 集成测试（完整流程）
- **gas/**: Gas 基准测试
- **mocks/**: Mock 合约

### 覆盖场景

- 正常批量发送
- 相同金额发送
- msg.value 多余/不足
- 空数组、零地址、零金额
- 授权不足
- 恶意接收者

## 常用命令

```bash
# 安装依赖
forge install

# 编译
forge build

# 测试
forge test
forge test --match-contract SendNative
forge test -vvv

# Gas 报告
forge test --gas-report
forge snapshot

# 部署 (CLI)
forge script script/Deploy.s.sol --rpc-url ethereum --broadcast --verify

# 部署 (Tron)
node script/deploy-tron.js --network mainnet

# 格式化
forge fmt
```

## 安全检查清单

部署前必须完成：

- [ ] 所有测试通过 (`forge test`)
- [ ] Gas snapshot 无异常增长 (`forge snapshot --check`)
- [ ] Slither 静态分析无高危问题
