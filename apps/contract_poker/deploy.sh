scarb build; starkli declare  target/dev/contract_poker_CardContract.contract_class.json --account ~/.starkli-wallets/deployer/account.json --keystore ~/.starkli-wallets/deployer/k.json | xargs -I % sh -c 'echo %; starkli deploy % --account ~/.starkli-wallets/deployer/account.json --keystore ~/.starkli-wallets/deployer/k.json'