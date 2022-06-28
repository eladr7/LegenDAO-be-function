import {Wallet, SecretNetworkClient} from "secretjs";

const ACCOUNT_MNEMONIC: string = process.env["ACCOUNT_MNEMONIC"] || "leave mask dinner title adult satisfy track crumble test concert damp bracket eager turtle laptop actual lesson divert hub behave risk write daughter tuition";
const NODE_ENDPOINT: string = process.env["NODE_ENDPOINT"] || "https://testnet-rpc.roninventures.io";
const NODE_ENDPOINT_PORT: string = process.env["NODE_ENDPOINT_PORT"] || "443";
const CHAIN_ID: string = process.env["CHAIN_ID"] || "pulsar-2";

export let secretNetworkClient = undefined;

export const getClient = async () => {
  let url = new URL(NODE_ENDPOINT);
  url.port = NODE_ENDPOINT_PORT;
  let nodeEndpointURL = url.toString();

  const wallet = new Wallet(ACCOUNT_MNEMONIC);
  const accAddress = wallet.address;

  secretNetworkClient =  await SecretNetworkClient.create({
    grpcWebUrl: nodeEndpointURL,
    chainId: CHAIN_ID,
    wallet: wallet,
    walletAddress: accAddress,
  });

  return secretNetworkClient;
};
