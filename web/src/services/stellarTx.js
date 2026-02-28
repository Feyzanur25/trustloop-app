import {
  Horizon,
  TransactionBuilder,
  Networks,
  Operation,
  BASE_FEE,
  Asset,
} from "stellar-sdk";

const HORIZON_URL = "https://horizon-testnet.stellar.org";

export async function buildManageDataTx(
  sourcePublicKey,
  name,
  value
) {
  if (!sourcePublicKey) {
    throw new Error("Missing source public key");
  }

  // ✅ DOĞRU Server kullanımı
  const server = new Horizon.Server(HORIZON_URL);

  // Account bilgisi (sequence alıyoruz)
  const account = await server.loadAccount(sourcePublicKey);

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
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
