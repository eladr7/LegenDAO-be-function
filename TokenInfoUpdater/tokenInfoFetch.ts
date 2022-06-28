import { queryNoParams } from "../shared/chainUtils";
import axios from "axios"
import { SecretNetworkClient } from "secretjs";
import { Context } from "@azure/functions"
import { secretNetworkClient } from "../shared/secretjsClient";
import { IInflationSchedule } from "../shared/schemas";


export interface ITokenInfo {
  apr: number,
  apy: number,
  liquidity: number,
  priceUsd: number,
  totalLocked: number,
  dailyVolume: number,
}

interface IOsmosisData {
  priceUsd: number,
  dailyVolume: number,
}

const getOsmosisDailyData = async (context: Context) => {
  const url = "https://api-osmosis.imperator.co/tokens/v2/".concat(
    process.env["TOKEN_SYMBOL"]
  );
  try {
    const response = await axios.get(url);
    const resopnseObj = response.data;

    const osmosisData: IOsmosisData = {
      priceUsd: resopnseObj[0].price,
      dailyVolume: parseInt(resopnseObj[0].volume_24h, 10),
    };

    return osmosisData;
  } catch (e) {
    context.log("Failed to fetch the token data from osmosis");
    throw e;
  }
};

async function getInflationScheduleFromDb(
  secretNetworkClient: SecretNetworkClient, 
  context: Context
): Promise<IInflationSchedule> {
  // Elad!! (And check the types probaly not IInflationSchedule {number, number})
  const currInflationSchedule: IInflationSchedule = {
    reward_per_block: 1,
    end_block: 10_000
  }
  return currInflationSchedule;
}

async function getRewarPerYear(secretNetworkClient: SecretNetworkClient, context: Context) {
  const currInflationSchedule: IInflationSchedule = await getInflationScheduleFromDb(secretNetworkClient, context);
  const rewardPerBlock = currInflationSchedule.reward_per_block;
  const endBlock = currInflationSchedule.end_block;

  const secondsPerBlock = parseInt(process.env["SECONDS_PER_BLOCK"]); //TODO: fetch from MongoDB
  const secondsInYear = 31536000;
  const blocksPerYear = secondsInYear / secondsPerBlock;
  const rewardPerYear = (blocksPerYear / endBlock) * rewardPerBlock;
  return rewardPerYear;
}

export const getUpdatedTokenInfoValues = async (context: Context): Promise<ITokenInfo> => {
  // Get from Osmosis the token's current price and daily volume
  const dailyData: IOsmosisData = await getOsmosisDailyData(context);

  if (Object.keys(dailyData).length === 0) {
    // Fetching the data from osmosis failed; MongoDB should not get updated
    throw "Fetching the data from osmosis failed; MongoDB should not get updated";
  }

  // query the blockchain to get current block height:
  const rewardPerYear = await getRewarPerYear(secretNetworkClient, context);

  const totalLockedResponse: any = await queryNoParams(
    secretNetworkClient,
    process.env["STAKING_ADDRESS"],
    "total_locked",
    context
  );
  const totalLocked = parseInt(totalLockedResponse.total_locked.amount);

  const apr = totalLocked ? (rewardPerYear * 100) / totalLocked : 0;
  // : (rewardPerYear * 100) / 20000000;

  const n = parseInt(process.env["NUM_OF_COMPOUNDING_PERIODS"]);
  const apy = Math.pow(1 + apr / n, n) - 1;

  const totalBalances: any = await queryNoParams(
    secretNetworkClient,
    process.env["PLATFORM_ADDRESS"],
    "total_balances",
    context
  );

  const liquidity =
    totalLocked +
    parseInt(totalBalances.total_balances.staked) +
    parseInt(totalBalances.total_balances.unbonding);

  const updatedValuesObj: ITokenInfo = {
    apr: apr,
    apy: apy,
    liquidity: liquidity,
    priceUsd: dailyData.priceUsd,
    totalLocked: totalLocked,
    dailyVolume: dailyData.dailyVolume,
  };
  return updatedValuesObj;
};
