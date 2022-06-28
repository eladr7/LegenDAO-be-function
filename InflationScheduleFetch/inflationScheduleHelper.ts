import { queryNoParams } from "../shared/chainUtils";
import { SecretNetworkClient } from "secretjs";
import { Context } from "@azure/functions"
import { IInflationSchedule } from "../shared/schemas";


const getInflationScheduleByBlockHeight = (inflationSchedule: string | any[], blockHeight: number) => {
  let i: number;
  for (i = 0; i < inflationSchedule.length; i++) {
    if (inflationSchedule[i].end_block > blockHeight) break;
  }
  return inflationSchedule[i];
};

export async function getInflationScheduleFromChain(
  secretNetworkClient: SecretNetworkClient, 
  context: Context
): Promise<IInflationSchedule> {
  // TODO: Check that the null input is correct
  const latestBlock = await secretNetworkClient.query.tendermint.getLatestBlock(null);
  const latestBlockHeight = latestBlock.block.header.height;

  // query inflation_schedule from the staking contract:
  const inflationSchedule: any = await queryNoParams(
    secretNetworkClient,
    process.env["STAKING_ADDRESS"],
    "inflation_schedule",
    context
  );

  const currInflationSchedule = getInflationScheduleByBlockHeight(
    inflationSchedule.inflation_schedule.inflation_schedule,
    parseInt(latestBlockHeight)
  );

  currInflationSchedule.reward_per_block = parseInt(currInflationSchedule.reward_per_block)
  return currInflationSchedule;
}