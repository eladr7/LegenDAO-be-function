# TimerTrigger - JavaScript

The `TimerTrigger` makes it incredibly easy to have your functions executed on a schedule. This sample demonstrates a simple use case of calling your function every 5 minutes.

## How it works

For a `TimerTrigger` to work, you provide a schedule in the form of a [cron expression](https://en.wikipedia.org/wiki/Cron#CRON_expression)(See the link for full details). A cron expression is a string with 6 separate expressions which represent a given schedule via patterns. The pattern we use to represent every 5 minutes is `0 */5 * * * *`. This, in plain text, means: "When seconds is equal to 0, minutes is divisible by 5, for any hour, day of the month, month, day of the week, or year".

## Functions in this repo

### TokenInfoUpdater

Updates these token's params into MongoDB every 10 minutes:
    apr
    apy
    liquidity
    priceUsd
    totalLocked
    dailyVolume

### InflationScheduleFetch

Fetches the inflation schedule from the LGND staking contract.
Runs once every two months.

## Env vars required

* MONGODB_URL (all)
* MONGODB_NAME (all)
* INFLATINO_SCHEDULE_COLLECTION_NAME (all)
* INFLATION_SCHEDULE_OBJECT_ID (all)
  
* TOKEN_INFO_COLLECTION_NAME (TokenInfoUpdater)
* TOKEN_INFO_OBJECT_ID (TokenInfoUpdater)
  
* ACCOUNT_MNEMONIC (all)
* NODE_ENDPOINT (all)
* NODE_ENDPOINT_PORT (all)
* CHAIN_ID (all)
* STAKING_ADDRESS (all)
  
* TOKEN_SYMBOL (TokenInfoUpdater)
* PLATFORM_ADDRESS (TokenInfoUpdater)
* SECONDS_PER_BLOCK (TokenInfoUpdater)
* NUM_OF_COMPOUNDING_PERIODS (TokenInfoUpdater)