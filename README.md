# Onekey Disperse Contract


### Setup

```sh
git clone https://github.com/OneKeyHQ/contracts
cd contracts
forge install
```

### Run Tests

```sh
forge test
```

### Update Gas Snapshots

```sh
forge snapshot
```

### Deploy Contract and Verify contract

```sh
forge script script/Disperse.s.sol:DisperseScript --rpc-url <rpc> --broadcast --verify --etherscan-api-key <key>
```

