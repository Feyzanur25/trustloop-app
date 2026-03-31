import {
  SorobanRpc,
  TransactionBuilder,
  TimeoutInfinite,
  nativeToScVal,
  xdr,
} from "stellar-sdk";
import { config } from "../lib/config";
import { signXdr } from "./wallet";

let sorobanClient = null;

export function getSorobanClient() {
  if (!sorobanClient) {
    sorobanClient = new SorobanRpc.Server(config.sorobanRpcUrl, {
      allowHttp: true,
    });
  }
  return sorobanClient;
}

export async function getAccountSequence(publicKey) {
  const account = await getSorobanClient().getAccount(publicKey);
  return account.sequenceNumber();
}

export async function getAccountBalance(publicKey) {
  try {
    const account = await getSorobanClient().getAccount(publicKey);
    const balance = account.balances.find(
      (b) => b.asset_type === "native"
    );
    return balance ? balance.balance : "0";
  } catch (error) {
    console.error("Error fetching balance:", error);
    throw error;
  }
}

export async function simulateTransaction(transaction) {
  return await getSorobanClient().simulateTransaction(transaction);
}

export async function sendTransaction(transaction) {
  return await getSorobanClient().sendTransaction(transaction);
}

export async function getTransactionStatus(transactionHash) {
  return await getSorobanClient().getTransaction(transactionHash);
}

export async function waitForTransaction(transactionHash, maxAttempts = 30) {
  const client = getSorobanClient();

  for (let i = 0; i < maxAttempts; i++) {
    const response = await client.getTransaction(transactionHash);

    if (response.status === "success") return response;
    if (response.status === "failed") throw new Error("Transaction failed");

    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  throw new Error("Transaction confirmation timeout");
}

export function buildUploadWasmTransaction(
  sourcePublicKey,
  wasmByteArray,
  fee = 1000
) {
  const uploadWasmOp = xdr.Operation.uploadWasmWasm({
    contents: wasmByteArray,
    hash: xdr.Hash.fromHex("0000000000000000000000000000000000000000000000000000000000000000"),
  });

  return new TransactionBuilder(sourcePublicKey, {
    fee: fee.toString(),
    networkPassphrase: config.networkPassphrase,
  })
    .setTimeout(TimeoutInfinite)
    .appendOperation(uploadWasmOp)
    .build();
}

export function buildDeployContractTransaction(
  sourcePublicKey,
  wasmId,
  fee = 1000
) {
  const deployContractOp = xdr.Operation.createDeployContractWithId({
    wasmId: xdr.Hash.fromHex(wasmId),
    salt: xdr.Salt.generate(),
  });

  return new TransactionBuilder(sourcePublicKey, {
    fee: fee.toString(),
    networkPassphrase: config.networkPassphrase,
  })
    .setTimeout(TimeoutInfinite)
    .appendOperation(deployContractOp)
    .build();
}

export function buildInvokeContractTransaction(
  sourcePublicKey,
  contractId,
  method,
  args = [],
  fee = 1000
) {
  const scArgs = args.map((arg) => nativeToScVal(arg));

  const invokeOp = xdr.Operation.invokeContractFunc({
    contractId: xdr.ScVal.scvAddress(
      xdr.ScAddress.addressTypeContract(contractId)
    ),
    funcName: xdr.Symbol.fromString(method),
    args: scArgs,
  });

  return new TransactionBuilder(sourcePublicKey, {
    fee: fee.toString(),
    networkPassphrase: config.networkPassphrase,
  })
    .setTimeout(TimeoutInfinite)
    .appendOperation(invokeOp)
    .build();
}

export async function signAndSendSorobanTx(transaction, network = "TESTNET") {
  const client = getSorobanClient();

  const signedXDR = await signXdr(transaction.toXDR(), network);
  return await client.sendTransaction(signedXDR);
}

export async function invokeContract({
  publicKey,
  contractId,
  method,
  args = [],
  fee = 1000,
}) {
  const client = getSorobanClient();
  const source = await client.getAccount(publicKey);

  const transaction = buildInvokeContractTransaction(
    publicKey,
    contractId,
    method,
    args,
    fee
  );

  transaction.source = source;

  const simResponse = await client.simulateTransaction(transaction);

  if (simResponse.results?.length > 0) {
    const prepared = await client.prepareTransaction(transaction, {
      transactionData: simResponse.transactionData,
      auth: simResponse.results[0].auth ? [simResponse.results[0].auth] : [],
    });

    const signed = await signXdr(prepared.toXDR(), "TESTNET");
    return await client.sendTransaction(signed);
  }

  const signed = await signXdr(transaction.toXDR(), "TESTNET");
  return await client.sendTransaction(signed);
}