# Description

Small hook to forrward % of incoming xah payments to a specific Vault Xahau account.

## Setup

    cd hooks
    nvm install 16
    nvm use 16
    npm install
    npm i -g c2wasm-cli xrpld-cli
    npm install -g ts-node

## Adjust hook to your destination and compile

modify hook **redirect.c** rAddress:

    #define XAH_FORWARD_ACT ""

example

    #define XAH_FORWARD_ACT "rAddress"

**compile hook:**

    c2wasm-cli rewardHook.c build/

## Set copiled hook onto host account

modify set script **reward_hook_set.ts** seed:

    const myWallet = Wallet.fromSeed('');

example

    const myWallet = Wallet.fromSeed('skey here');

**Then run the script to set it**

    ts-node reward_hook_set.ts
