import {
    Client,
    Wallet,
    SetHookFlags
  } from '@transia/xrpl';
  import {
    createHookPayload,
    setHooksV3,
    type SetHookParams,
  } from '@transia/hooks-toolkit';
  import * as xrpl from 'xrpl';
  
  export async function main(): Promise<void> {
    try {
      // 1) Connect to the Xahau network
      const serverUrl = 'wss://nyc.xahaud.com'; // or wss://nyc.xahaud.com
      const client = new Client(serverUrl);
      await client.connect();
      client.networkID = await client.getNetworkID();
  
      // 2) This is the hooking (store) account that will have the Hook installed
      //    Make sure it has a trust line for XAH if you plan to send/receive XAH.
      const myWallet = Wallet.fromSeed('vault-Skey');
  
      console.log('Creating hook payload...');
      // 3) Create the Hook payload. Instead of 'redirect', we use the name that matches rewardHook.c
      //    Also set the flags to 0 so it DOES NOT override the original transaction.
      //    We still want to hook on 'Payment' events.
      const hookPayload = createHookPayload(
        0,                // version
        'rewardHook',     // createFile => matches your rewardHook.c => rewardHook.wasm
        'rewardHook',     // namespace
        0,                // flags => 0 means NO override 
        ['Payment']       // hookOnArray => triggers for Payment
      );
  
      console.log('Generated hook payload:', hookPayload);
  
      try {
        console.log('Setting hook...');
        // 4) Set the Hook using the Hooks Toolkit
        await setHooksV3({
          client: client,
          seed: myWallet.seed,   // hooking account's seed
          hooks: [{ Hook: hookPayload }],
        } as SetHookParams);
  
        console.log('Hook set successfully.');
      } catch (error) {
        console.error('Error setting hook:', error);
      }
  
      await client.disconnect();
      console.log('Disconnected from server.');
    } catch (error) {
      console.error('Error occurred:', error);
    }
  }
  
  main();
  