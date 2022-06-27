# TimerTrigger - JavaScript

The `TimerTrigger` makes it incredibly easy to have your functions executed on a schedule. This sample demonstrates a simple use case of calling your function every 5 minutes.

## How it works

For a `TimerTrigger` to work, you provide a schedule in the form of a [cron expression](https://en.wikipedia.org/wiki/Cron#CRON_expression)(See the link for full details). A cron expression is a string with 6 separate expressions which represent a given schedule via patterns. The pattern we use to represent every 5 minutes is `0 */5 * * * *`. This, in plain text, means: "When seconds is equal to 0, minutes is divisible by 5, for any hour, day of the month, month, day of the week, or year".

## Functions in this repo

### TokenInfoUpdater

Updates these token's params into MongoDB:
    apr
    apy
    liquidity
    priceUsd
    totalLocked
    dailyVolume

## Env vars required

* MONGODB_URL -
* MONGODB_NAME -
* MONGODB_COLLECTION_NAME -
* TOKEN_INFO_OBJECT_ID -
* TOKEN_SYMBOL -
* QUERYING_ACCOUNT_MNEMONIC -
* NODE_ENDPOINT -
* NODE_ENDPOINT_PORT -
* CHAIN_ID -
* STAKING_ADDRESS -
* PLATFORM_ADDRESS -
* SECONDS_PER_BLOCK -
* NUM_OF_COMPOUNDING_PERIODS -