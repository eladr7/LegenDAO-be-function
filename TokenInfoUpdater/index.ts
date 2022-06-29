import { AzureFunction, Context } from "@azure/functions"
import { ObjectId } from "mongodb";

import {getUpdatedTokenInfoValues, ITokenInfo} from "./tokenInfoFetch";
import {dbInstance, getDbInstance} from "../shared/db";
import { getClient, secretNetworkClient } from "../shared/chainUtils";
import { TOKEN_INFO_COLLECTION_NAME, TOKEN_INFO_OBJECT_ID } from "./envVars";


const timerTrigger: AzureFunction = async function (context: Context, myTimer: any): Promise<void> {
    var timeStamp = new Date().toISOString();
    
    // if (myTimer.isPastDue)
    // {
    //     context.log('Timer function TokenInfoUpdater is running late!');
    // }
    // context.log('Timer triggered TokenInfoUpdater: Start!', timeStamp);

    if (!dbInstance) {
      await getDbInstance();
    }

    if (!secretNetworkClient) {
      await getClient();
    }

    const updatedValuesObj: ITokenInfo = await getUpdatedTokenInfoValues(secretNetworkClient, context);
    if (Object.keys(updatedValuesObj).length === 0) {
      context.log("Fetching the data failed; MongoDB should not get updated");
      return;
    }

    // Get the object ID to update
    const tokenInfoObjectId = new ObjectId(
      TOKEN_INFO_OBJECT_ID
    );
    const queryBy = { _id: tokenInfoObjectId };

    const newvalues = { $set: updatedValuesObj };
    dbInstance
      .collection(TOKEN_INFO_COLLECTION_NAME)
      .updateOne(queryBy, newvalues, function (err, res) {
        if (err) throw err;
        // context.log(
        //   "Updated the token info with these values: ",
        //   updatedValuesObj
        // );
      });
};

export default timerTrigger;