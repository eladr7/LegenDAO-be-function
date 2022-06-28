import { Context } from "@azure/functions";
import { SecretNetworkClient } from "secretjs";

export async function queryNoParams(
  secretNetworkClient: SecretNetworkClient, 
  contractAddress: string, 
  queryName: string, 
  context: Context
) {
  try {
    return await secretNetworkClient.query.compute.queryContract({
      contractAddress: contractAddress,
      query: {
        [queryName]: {},
      },
    });
  } catch (e) {
    context.log(`query ${queryName} failed: ${e}`);
  }
  return null;
}
