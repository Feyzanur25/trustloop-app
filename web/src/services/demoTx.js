// web/src/services/demoTx.js
import * as StellarSdk from "stellar-sdk";

const HORIZON_TESTNET = "https://horizon-testnet.stellar.org";

function safeValue(loopId, action) {
  const v = `${loopId}|${action}`;
  return v.length > 60 ? v.slice(0, 60) : v;
}

export async function buildDemoManageDataXdr(
  publicKey,
  { loopId = "TL-001", action = "created" } = {}
) {
  const server = new StellarSdk.Horizon.Server(HORIZON_TESTNET);

  const account = await server.loadAccount(publicKey);

  const tx = new StellarSdk.TransactionBuilder(account, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: StellarSdk.Networks.TESTNET,
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
