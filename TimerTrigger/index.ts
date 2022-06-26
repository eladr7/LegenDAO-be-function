import { AzureFunction, Context } from "@azure/functions"
// require("dotenv");
import { MongoClient, ObjectId } from "mongodb";


// import { get } from "axios";
import get from "axios"
import { Wallet, SecretNetworkClient } from "secretjs";




const DATABASE_URL= "mongodb+srv://elad-dev:g3gOG7qCRsjzMxcV@cluster0.krgikeg.mongodb.net/test?retryWrites=true&w=majority";
const DATABASE_NAME= "test";
const COLLECTION_NAME= "test1";
const TOKEN_INFO_OBJECT_ID= "62b0678e9cca636585585d4f";
const TOKEN_SYMBOL= "SCRT";
const QUERYING_ACCOUNT_MNEMONIC= "leave mask dinner title adult satisfy track crumble test concert damp bracket eager turtle laptop actual lesson divert hub behave risk write daughter tuition";
const NODE_ENDPOINT= "http://rpc.pulsar.griptapejs.com:9091/";
const CHAIN_ID= "pulsar-2";
const STAKING_ADDRESS= "secret1xrat5zltdux0fd3ka5n3lm7w84wa6xcvp8gcxh";
const PLATFORM_ADDRESS= "secret1nyqmrcwztjvfwr6chts46sv3eq9tpmvrfkv3qu";
const SECONDS_PER_BLOCK= "5.7695";
const NUM_OF_COMPOUNDING_PERIODS= "52";

const createCli = async (mnemonic: string, rest_endpoint: string, chain_id: string) => {
  let url = new URL(rest_endpoint);
  url.port = "9091";
  rest_endpoint = url.toString();

  const wallet = new Wallet(mnemonic);
  const accAddress = wallet.address;

  return await SecretNetworkClient.create({
    grpcWebUrl: rest_endpoint,
    chainId: chain_id,
    wallet: wallet,
    walletAddress: accAddress,
  });
};

const getClient = async () => {
  return await createCli(
    QUERYING_ACCOUNT_MNEMONIC,
    NODE_ENDPOINT,
    CHAIN_ID
  );
};

async function queryNoParams(secretNetwork: SecretNetworkClient, contractAddress: string, queryName: string) {
  try {
    return await secretNetwork.query.compute.queryContract({
      contractAddress: contractAddress,
      query: {
        [queryName]: {},
      },
    });
  } catch (e) {
    console.log(`query ${queryName} failed: ${e}`);
  }
  return null;
}

const getOsmosisDailyData = async () => {
    const url = "https://api-osmosis.imperator.co/tokens/v2/".concat(
      TOKEN_SYMBOL
    );
    try {
      const response = await get(url);
      const resopnseObj = response.data;
  
      const osmosisData = {
        priceUsd: resopnseObj[0].price,
        dailyVolume: parseInt(resopnseObj[0].volume_24h, 10),
      };
  
      return osmosisData;
    } catch (e) {
      console.log("Failed to fetch the token data from osmosis:", e);
      return {};
    }
  };
  
  const getInflationScheduleByBlockHeight = (inflationSchedule: string | any[], blockHeight: number) => {
    let i;
    for (i = 0; i < inflationSchedule.length; i++) {
      if (inflationSchedule[i].end_block > blockHeight) break;
    }
    return inflationSchedule[i];
  };
  
  async function getRewarPerYear(secretNetwork: any) {
    const latestBlock = await secretNetwork.query.tendermint.getLatestBlock();
    const latestBlockHeight = latestBlock.block.header.height;
  
    // query inflation_schedule from the staking contract:
    const inflationSchedule: any = await queryNoParams(
      secretNetwork,
      STAKING_ADDRESS,
      "inflation_schedule"
    );
  
    const currInflationSchedule = getInflationScheduleByBlockHeight(
      inflationSchedule.inflation_schedule.inflation_schedule,
      latestBlockHeight
    );
    const rewardPerBlock = parseInt(currInflationSchedule.reward_per_block);
    const endBlock = currInflationSchedule.end_block;
  
    const secondsPerBlock = parseInt(SECONDS_PER_BLOCK); //TODO: fetch from MongoDB
    const secondsInYear = 31536000;
    const blocksPerYear = secondsInYear / secondsPerBlock;
    const rewardPerYear = (blocksPerYear / endBlock) * rewardPerBlock;
    return rewardPerYear;
  }
  
  const getUpdatedTokenInfoValues = async () => {
    // Get from Osmosis the token's current price and daily volume
    const dailyData: any = await getOsmosisDailyData();
  
    if (Object.keys(dailyData).length === 0) {
      // Fetching the data from osmosis failed; MongoDB should not get updated
      return {};
    }
  
    const secretNetwork = await getClient();
  
    // query the blockchain to get current block height:
    const rewardPerYear = await getRewarPerYear(secretNetwork);
  
    const totalLockedResponse: any = await queryNoParams(
      secretNetwork,
      STAKING_ADDRESS,
      "total_locked"
    );
    console.log("totalLockedResponse are : ", totalLockedResponse)
    const totalLocked = parseInt(totalLockedResponse.total_locked.amount);
  
    const apr = totalLocked ? (rewardPerYear * 100) / totalLocked : 0;
    // : (rewardPerYear * 100) / 20000000;
  
    const n = parseInt(NUM_OF_COMPOUNDING_PERIODS);
    const apy = Math.pow(1 + apr / n, n) - 1;
  
    const totalBalances: any = await queryNoParams(
      secretNetwork,
      PLATFORM_ADDRESS,
      "total_balances"
    );
  
    const liquidity =
      totalLocked +
      parseInt(totalBalances.total_balances.staked) +
      parseInt(totalBalances.total_balances.unbonding) + 80;
  
    const updatedValuesObj = {
      apr: apr,
      apy: apy,
      liquidity: liquidity,
      priceUsd: dailyData.priceUsd,
      totalLocked: totalLocked,
      dailyVolume: dailyData.dailyVolume,
    };
    return updatedValuesObj;
  };





const timerTrigger: AzureFunction = async function (context: Context, myTimer: any): Promise<void> {
    var timeStamp = new Date().toISOString();
    
    if (myTimer.isPastDue)
    {
        context.log('Timer function is running late!');
    }
    context.log('Timer trigger function ran! Start!', timeStamp);
    var databaseObj;
    var mongoDb;
    MongoClient.connect(DATABASE_URL, function (err, db) {
      if (err) throw err;
      databaseObj = db.db(DATABASE_NAME);
      mongoDb = db;
    });
    
    const clients = {};
    

    const cronjobServer = async () => {
        console.log("Perform another cron job:");
      
        const updatedValuesObj = await getUpdatedTokenInfoValues();
        if (Object.keys(updatedValuesObj).length === 0) {
          // Fetching the data from osmosis failed; MongoDB should not get updated
          return;
        }
      
        // Get the query object
        const tokenInfoObjectId = new ObjectId(TOKEN_INFO_OBJECT_ID);
        const queryBy = { _id: tokenInfoObjectId };
      
        const newvalues = { $set: updatedValuesObj };
        databaseObj
          .collection(COLLECTION_NAME)
          .updateOne(queryBy, newvalues, function (err, res) {
            if (err) throw err;
            console.log("1 document updated");
            mongoDb.close();
          });
      };

    cronjobServer();

    context.log('Timer trigger function ran! Start!', timeStamp);
};

export default timerTrigger;
