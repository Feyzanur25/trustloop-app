import { Horizon, TransactionBuilder, Operation, BASE_FEE } from "stellar-sdk";
import { config } from "../lib/config";

export async function buildManageDataTx(sourcePublicKey, name, value) {
  if (!sourcePublicKey) {
    throw new Error("Missing source public key");
  }

  const server = new Horizon.Server(config.horizonUrl);
  const account = await server.loadAccount(sourcePublicKey);

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: config.networkPassphrase,
  })
    .addOperation(
      Operation.manageData({
        name,
        value,
      })
    )
    .setTimeout(30)
    .build();

  return tx.toXDR();
}
