import { AzureFunction, Context } from "@azure/functions"
import { ObjectId } from "mongodb";

import {getUpdatedTokenInfoValues, ITokenInfo} from "./tokenInfoFetch";
import {dbInstance, getDbInstance} from "../shared/db";
import { getClient, secretNetworkClient } from "../shared/secretjsClient";


const timerTrigger: AzureFunction = async function (context: Context, myTimer: any): Promise<void> {
    var timeStamp = new Date().toISOString();
    
    if (myTimer.isPastDue)
    {
        context.log('Timer function TokenInfoUpdater is running late!');
    }
    context.log('Timer triggered TokenInfoUpdater: Start!', timeStamp);

    if (!dbInstance) {
      await getDbInstance();
    }

    if (!secretNetworkClient) {
      await getClient();
    }

    const updatedValuesObj: ITokenInfo = await getUpdatedTokenInfoValues(context);
    if (Object.keys(updatedValuesObj).length === 0) {
      // Fetching the data failed; MongoDB should not get updated
      return;
    }

    // Get the query object
    const tokenInfoObjectId = new ObjectId(
      process.env["TOKEN_INFO_OBJECT_ID"]
    );
    const queryBy = { _id: tokenInfoObjectId };

    const newvalues = { $set: updatedValuesObj };
    dbInstance
      .collection(process.env["TOKEN_INFO_COLLECTION_NAME"])
      .updateOne(queryBy, newvalues, function (err, res) {
        if (err) throw err;
        context.log(
          "Updated the token info with these values: ",
          updatedValuesObj
        );
      });
};

export default timerTrigger;