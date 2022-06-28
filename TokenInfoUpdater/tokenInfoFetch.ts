import { queryNoParams } from "../shared/chainUtils";
import axios from "axios"
import { Context } from "@azure/functions"
import { IInflationSchedule } from "../shared/inflationSchedule";
import { ObjectId } from "mongodb";
import { SecretNetworkClient } from "secretjs";
import { TOKEN_SYMBOL, INFLATION_SCHEDULE_OBJECT_ID, TOKEN_INFO_COLLECTION_NAME, SECONDS_PER_BLOCK, STAKING_ADDRESS, NUM_OF_COMPOUNDING_PERIODS, PLATFORM_ADDRESS, INFLATINO_SCHEDULE_COLLECTION_NAME } from "./envVars";
import { dbInstance } from "../shared/db";


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
    TOKEN_SYMBOL
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

async function getInflationScheduleFromDb(): Promise<IInflationSchedule> {
  // Get the query object
  const tokenInfoObjectId = new ObjectId(INFLATION_SCHEDULE_OBJECT_ID);
  const findBy = { _id: tokenInfoObjectId };

  const currInflationSchedule = await dbInstance
    .collection(INFLATINO_SCHEDULE_COLLECTION_NAME)
    .find(findBy)
    .toArray();
    if (currInflationSchedule.length === 0) {
      throw "Inflation schedule fetching had failed. Exiting";
    }
  
  return currInflationSchedule[0];
}

async function getRewarPerYear() {
  const currInflationSchedule: IInflationSchedule = await getInflationScheduleFromDb();
  const rewardPerBlock = currInflationSchedule.rewardPerBlock;
  const endBlock = currInflationSchedule.endBlock;

  const secondsPerBlock = parseFloat(SECONDS_PER_BLOCK); //TODO: fetch from MongoDB
  const secondsInYear = 31536000;
  const blocksPerYear = secondsInYear / secondsPerBlock;
  const rewardPerYear = (blocksPerYear / endBlock) * rewardPerBlock;
  return rewardPerYear;
}

export const getUpdatedTokenInfoValues = async (secretNetworkClient: SecretNetworkClient, context: Context): Promise<ITokenInfo> => {
  // Get from Osmosis the token's current price and daily volume
  const dailyData: IOsmosisData = await getOsmosisDailyData(context);

  if (Object.keys(dailyData).length === 0) {
    throw "Fetching the data from osmosis failed; MongoDB should not get updated";
  }

  // Query the blockchain to get current block height:
  const rewardPerYear = await getRewarPerYear();

  const totalLockedResponse: any = await queryNoParams(
    secretNetworkClient,
    STAKING_ADDRESS,
    "total_locked",
    context
  );
  const totalLocked = parseInt(totalLockedResponse.total_locked.amount);

  const apr = totalLocked ? (rewardPerYear * 100) / totalLocked : 0;
  // : (rewardPerYear * 100) / 20000000;

  const n = parseFloat(NUM_OF_COMPOUNDING_PERIODS);
  const apy = Math.pow(1 + apr / n, n) - 1;

  const totalBalances: any = await queryNoParams(
    secretNetworkClient,
    PLATFORM_ADDRESS,
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
