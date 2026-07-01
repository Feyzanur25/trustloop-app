// web/src/services/demoTx.js
import * as StellarSdk from "stellar-sdk";
import { config } from "../lib/config";

function safeValue(loopId, action) {
  const v = `${loopId}|${action}`;
  return v.length > 60 ? v.slice(0, 60) : v;
}

export async function buildDemoManageDataXdr(
  publicKey,
  { loopId = "TL-001", action = "created" } = {}
) {
  const server = new StellarSdk.Horizon.Server(config.horizonUrl);

  const account = await server.loadAccount(publicKey);

  const tx = new StellarSdk.TransactionBuilder(account, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: config.networkPassphrase,
  })
    .addOperation(
      StellarSdk.Operation.manageData({
        name: `trust.${action}`,
        value: safeValue(loopId, action),
      })
    )
    .setTimeout(180)
    .build();

  return tx.toXDR();
}
