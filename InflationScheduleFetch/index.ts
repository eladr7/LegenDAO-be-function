import { AzureFunction, Context } from "@azure/functions"
import { ObjectId } from "mongodb";
import { getClient, secretNetworkClient } from "../shared/chainUtils";

import {dbInstance, getDbInstance} from "../shared/db";
import { IInflationSchedule } from "../shared/inflationSchedule";
import { INFLATION_SCHEDULE_OBJECT_ID, INFLATINO_SCHEDULE_COLLECTION_NAME } from "./envVars";
import { getInflationScheduleFromChain } from "./inflationScheduleHelper";


const timerTrigger: AzureFunction = async function (context: Context, myTimer: any): Promise<void> {
    var timeStamp = new Date().toISOString();
    
    if (myTimer.isPastDue)
    {
        context.log('Timer function InflationScheduleFetch is running late!');
    }
    context.log('Timer triggered InflationScheduleFetch: Start!', timeStamp);

    if (!dbInstance) {
      await getDbInstance();
    }

    if (!secretNetworkClient) {
      await getClient();
    }

    const currInflationSchedule: IInflationSchedule = await getInflationScheduleFromChain(
      secretNetworkClient, 
      context
    );
    if (!currInflationSchedule) {
      context.log("Fetching the inflation schedule failed; MongoDB should not get updated");
      return;
    }
    
    // Get the object ID to update
    const tokenInfoObjectId = new ObjectId(INFLATION_SCHEDULE_OBJECT_ID);
    const queryBy = { _id: tokenInfoObjectId };

    const newvalues = { $set: currInflationSchedule };
    dbInstance
      .collection(INFLATINO_SCHEDULE_COLLECTION_NAME)
      .updateOne(queryBy, newvalues, function (err, res) {
        if (err) throw err;
        context.log(
          "Updated the inflation schedule: ",
          currInflationSchedule
        );
      });
};

export default timerTrigger;