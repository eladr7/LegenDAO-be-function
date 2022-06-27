import { Context } from "@azure/functions";
import {Wallet, SecretNetworkClient} from "secretjs";

export const getClient = async (mnemonic: string, restEndpoint: string | URL, restEndpointPort: string, chain_id: string) => {
  let url = new URL(restEndpoint);
  url.port = process.env["NODE_ENDPOINT_PORT"];
  restEndpoint = url.toString();

  const wallet = new Wallet(mnemonic);
  const accAddress = wallet.address;

  return await SecretNetworkClient.create({
    grpcWebUrl: restEndpoint,
    chainId: chain_id,
    wallet: wallet,
    walletAddress: accAddress,
  });
};

export async function queryNoParams(secretNetwork: SecretNetworkClient, contractAddress: string, queryName: string, context: Context) {
  try {
    return await secretNetwork.query.compute.queryContract({
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
