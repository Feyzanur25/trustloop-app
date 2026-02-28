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
  const client = getSorobanClient();
  const account = await client.getAccount(publicKey);
  return account.sequenceNumber();
}

export async function getAccountBalance(publicKey) {
  const client = getSorobanClient();
  try {
    const account = await client.getAccount(publicKey);
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
  const client = getSorobanClient();
  const simResponse = await client.simulateTransaction(transaction);
  return simResponse;
}

export async function sendTransaction(transaction) {
  const client = getSorobanClient();
  const sendResponse = await client.sendTransaction(transaction);
  return sendResponse;
}

export async function getTransactionStatus(transactionHash) {
  const client = getSorobanClient();
  const getResponse = await client.getTransaction(transactionHash);
  return getResponse;
}

export async function waitForTransaction(transactionHash, maxAttempts = 30) {
  const client = getSorobanClient();
  
  for (let i = 0; i < maxAttempts; i++) {
    const response = await client.getTransaction(transactionHash);
    
    if (response.status === "success") {
      return response;
    } else if (response.status === "failed") {
      throw new Error(`Transaction failed`);
    }
    
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  
  throw new Error("Transaction confirmation timeout");
}

export function buildUploadWasmTransaction(
  sourcePublicKey,
  wasmByteArray,
  fee = 1000
) {
  const client = getSorobanClient();
  
  const uploadWasmOp = xdr.Operation.uploadWasmWasm({
    contents: wasmByteArray,
    hash: xdr.Hash.fromHex("0000000000000000000000000000000000000000000000000000000000000000"),
  });

  const transaction = new TransactionBuilder(
    sourcePublicKey,
    {
      fee: fee.toString(),
      networkPassphrase: config.networkPassphrase,
    }
  )
    .setTimeout(TimeoutInfinite)
    .appendOperation(uploadWasmOp)
    .build();

  return transaction;
}

export function buildDeployContractTransaction(
  sourcePublicKey,
  wasmId,
  fee = 1000
) {
  const client = getSorobanClient();
  
  const deployContractOp = xdr.Operation.createDeployContractWithId({
    wasmId: xdr.Hash.fromHex(wasmId),
    salt: xdr.Salt.generate(),
  });

  const transaction = new TransactionBuilder(
    sourcePublicKey,
    {
      fee: fee.toString(),
      networkPassphrase: config.networkPassphrase,
    }
  )
    .setTimeout(TimeoutInfinite)
    .appendOperation(deployContractOp)
    .build();

  return transaction;
}

export function buildInvokeContractTransaction(
  sourcePublicKey,
  contractId,
  method,
  args = [],
  fee = 1000
) {
  const client = getSorobanClient();
  
  const scArgs = args.map((arg) => nativeToScVal(arg));
  
  const invokeOp = xdr.Operation.invokeContractFunc({
    contractId: xdr.ScVal.scvAddress(
      xdr.ScAddress.addressTypeContract(contractId)
    ),
    funcName: xdr.Symbol.fromString(method),
    args: scArgs,
  });

  const transaction = new TransactionBuilder(
    sourcePublicKey,
    {
      fee: fee.toString(),
      networkPassphrase: config.networkPassphrase,
    }
  )
    .setTimeout(TimeoutInfinite)
    .appendOperation(invokeOp)
    .build();

  return transaction;
}

export async function signAndSendSorobanTx(
  transaction,
  publicKey,
  network = "TESTNET"
) {
  const client = getSorobanClient();
  
  const transactionXDR = transaction.toXDR();
  
  const signedXDR = await signXdr(transactionXDR, network);
  
  const response = await client.sendTransaction(signedXDR);
  
  return response;
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
  
  if (simResponse.results && simResponse.results.length > 0) {
    const transactionData = simResponse.transactionData;
    const auth = simResponse.results[0].auth;
    
    const preparedTransaction = await client.prepareTransaction(transaction, {
      transactionData,
      auth: auth ? [auth] : [],
    });
  
    const signedXDR = await signXdr(preparedTransaction.toXDR(), "TESTNET");
    
    const response = await client.sendTransaction(signedXDR);
    
    return response;
  }
  
  const signedXDR = await signXdr(transaction.toXDR(), "TESTNET");
  const response = await client.sendTransaction(signedXDR);
  
  return response;
}

export async function deployContract({
  publicKey,
  wasmId,
  fee = 5000,
}) {
  const client = getSorobanClient();
  
  const source = await client.getAccount(publicKey);
  
  const transaction = buildDeployContractTransaction(
    publicKey,
    wasmId,
    fee
  );
  
  transaction.source = source;
  
  const simResponse = await client.simulateTransaction(transaction);
  
  if (simResponse.results && simResponse.results.length > 0) {
    const transactionData = simResponse.transactionData;
    
    const preparedTransaction = await client.prepareTransaction(transaction, {
      transactionData,
    });
  
    const signedXDR = await signXdr(preparedTransaction.toXDR(), "TESTNET");
    
    const response = await client.sendTransaction(signedXDR);
    
    return response;
  }
  
  const signedXDR = await signXdr(transaction.toXDR(), "TESTNET");
  const response = await client.sendTransaction(signedXDR);
  
  return response;
}

export async function uploadWasm({
  publicKey,
  wasmByteArray,
  fee = 10000,
}) {
  const client = getSorobanClient();
  
  const source = await client.getAccount(publicKey);
  
  const transaction = buildUploadWasmTransaction(
    publicKey,
    wasmByteArray,
    fee
  );
  
  transaction.source = source;
  
  const simResponse = await client.simulateTransaction(transaction);
  
  if (simResponse.results && simResponse.results.length > 0) {
    const transactionData = simResponse.transactionData;
    
    const preparedTransaction = await client.prepareTransaction(transaction, {
      transactionData,
    });
  
    const signedXDR = await signXdr(preparedTransaction.toXDR(), "TESTNET");
    
    const response = await client.sendTransaction(signedXDR);
    
    return response;
  }
  
  const signedXDR = await signXdr(transaction.toXDR(), "TESTNET");
  const response = await client.sendTransaction(signedXDR);
  
  return response;
}
