import { queryNoParams } from "../shared/chainUtils";
// import { SecretNetworkClient } from "secretjs";
import { Context } from "@azure/functions"
import { IInflationSchedule } from "../shared/inflationSchedule";
import { STAKING_ADDRESS } from "./envVars";


const getInflationScheduleByBlockHeight = (inflationSchedule: string | any[], blockHeight: number) => {
  let i: number;
  for (i = 0; i < inflationSchedule.length; i++) {
    if (inflationSchedule[i].endBlock > blockHeight) break;
  }
  return inflationSchedule[i];
};

export async function getInflationScheduleFromChain(
  secretNetworkClient: any, 
  context: Context
): Promise<IInflationSchedule> {
  const latestBlock = await secretNetworkClient.query.tendermint.getLatestBlock();
  // context.log("latestBlock: ", latestBlock);

  const latestBlockHeight = latestBlock.block.header.height;

  // Query inflation_schedule from the staking contract:
  const inflationSchedule: any = await queryNoParams(
    secretNetworkClient,
    STAKING_ADDRESS,
    "inflation_schedule",
    context
  );

  const currInflationSchedule = getInflationScheduleByBlockHeight(
    inflationSchedule.inflation_schedule.inflation_schedule,
    parseInt(latestBlockHeight)
  );

  currInflationSchedule.rewardPerBlock = parseInt(currInflationSchedule.rewardPerBlock)
  return currInflationSchedule;
}