import {
  BASE_FEE,
  Horizon,
  Keypair,
  Memo,
  Operation,
  Transaction,
  TransactionBuilder,
  Utils,
  StrKey,
} from "stellar-sdk";
import { config } from "./config.js";
import { badRequest, conflict, unauthorized } from "./errors.js";
import { repository } from "./repository.js";
import { createOpaqueToken } from "./config.js";

const server = new Horizon.Server(config.horizonUrl);

function getSponsorKeypair() {
  return Keypair.fromSecret(config.sponsorSecretKey);
}

function getChallengeKeypair() {
  return Keypair.fromSecret(config.challengeSecretKey);
}

function getExpectedSponsorPublicKey() {
  return config.sponsorPublicKey || getSponsorKeypair().publicKey();
}

function assertNetworkPassphrase(passphrase) {
  if (passphrase !== config.networkPassphrase) {
    throw badRequest(`Transaction was signed for the wrong Stellar network. Expected ${config.network}.`);
  }
}

export async function buildChallenge(publicKey) {
  const accountId = String(publicKey || "").trim();
  if (!StrKey.isValidEd25519PublicKey(accountId)) {
    throw badRequest("walletAddress must be a valid Stellar public key.");
  }

  const challengeKeypair = getChallengeKeypair();
  const challenge = Utils.buildChallengeTx(
    challengeKeypair,
    accountId,
    config.homeDomain,
    config.challengeNetworkTimeout,
    config.networkPassphrase,
    config.webAuthDomain,
    null,
    config.webAuthDomain,
  );

  const state = repository.getState();
  const challengeId = createOpaqueToken();
  const expiresAt = new Date(Date.now() + config.challengeTtlSeconds * 1000).toISOString();

  state.auth.challenges = state.auth.challenges.filter((item) => item.walletAddress !== accountId);
  state.auth.challenges.push({
    id: challengeId,
    walletAddress: accountId,
    challengeXdr: challenge,
    expiresAt,
  });
  repository.save();

  return {
    challengeId,
    network: config.network,
    expiresAt,
    xdr: challenge,
  };
}

export async function verifyChallenge({ challengeId, signedXdr }) {
  const state = repository.getState();
  const challengeRecord = state.auth.challenges.find((item) => item.id === challengeId);
  if (!challengeRecord) {
    throw unauthorized("Challenge expired or not found.");
  }
  if (new Date(challengeRecord.expiresAt).getTime() <= Date.now()) {
    throw unauthorized("Challenge expired.");
  }

  const challengeKeypair = getChallengeKeypair();
  const signerSummary = (await server.loadAccount(challengeRecord.walletAddress)).signers;
  const signers = Utils.verifyChallengeTxThreshold(
    signedXdr,
    challengeKeypair.publicKey(),
    config.networkPassphrase,
    1,
    signerSummary,
    config.homeDomain,
    config.webAuthDomain,
  );

  if (!Array.isArray(signers) || !signers.length) {
    throw unauthorized("Signed challenge did not match the requested wallet.");
  }

  const token = createOpaqueToken();
  const expiresAt = new Date(Date.now() + config.sessionTtlMinutes * 60_000).toISOString();

  state.auth.challenges = state.auth.challenges.filter((item) => item.id !== challengeId);
  state.auth.sessions.push({
    token,
    walletAddress: challengeRecord.walletAddress,
    createdAt: new Date().toISOString(),
    expiresAt,
  });
  repository.save();

  return {
    token,
    walletAddress: challengeRecord.walletAddress,
    expiresAt,
  };
}

export function resolveSession(token) {
  const state = repository.getState();
  const session = state.auth.sessions.find((item) => item.token === token);
  if (!session || new Date(session.expiresAt).getTime() <= Date.now()) {
    throw unauthorized("Session expired or invalid.");
  }
  return session;
}

export async function buildSponsoredManageDataTransaction({
  walletAddress,
  action,
  loopId,
  memo,
  detail,
}) {
  const sourceAccount = await server.loadAccount(walletAddress);
  const tx = new TransactionBuilder(sourceAccount, {
    fee: config.sponsorBaseFee || BASE_FEE,
    networkPassphrase: config.networkPassphrase,
  })
    .addMemo(Memo.text(String(memo || `trustloop:${action}`).slice(0, 28)))
    .addOperation(
      Operation.manageData({
        name: `trustloop:${action}`.slice(0, 64),
        value: `${loopId}|${detail}`.slice(0, 64),
        source: walletAddress,
      }),
    )
    .setTimeout(config.sponsorshipIntentTtlSeconds)
    .build();

  const state = repository.getState();
  const intentId = createOpaqueToken();
  const expiresAt = new Date(Date.now() + config.sponsorshipIntentTtlSeconds * 1000).toISOString();
  state.auth.sponsorshipIntents.push({
    id: intentId,
    walletAddress,
    action,
    loopId,
    unsignedXdr: tx.toXDR(),
    expiresAt,
    status: "pending",
  });
  repository.save();

  return {
    intentId,
    xdr: tx.toXDR(),
    expiresAt,
    sponsorPublicKey: getExpectedSponsorPublicKey(),
    network: config.network,
  };
}

export async function submitSponsoredTransaction({ intentId, signedXdr, walletAddress }) {
  const state = repository.getState();
  const intent = state.auth.sponsorshipIntents.find((item) => item.id === intentId);
  if (!intent) {
    throw unauthorized("Sponsorship intent expired or not found.");
  }
  if (intent.status !== "pending") {
    throw conflict("Sponsorship intent has already been consumed.");
  }
  if (intent.walletAddress !== walletAddress) {
    throw unauthorized("Authenticated wallet does not match the transaction source account.");
  }
  if (new Date(intent.expiresAt).getTime() <= Date.now()) {
    throw unauthorized("Sponsorship intent expired.");
  }

  const innerTx = new Transaction(signedXdr, config.networkPassphrase);
  assertNetworkPassphrase(innerTx.networkPassphrase);
  if (innerTx.source !== walletAddress) {
    throw unauthorized("Signed transaction source does not match the authenticated wallet.");
  }

  const innerHash = innerTx.hash().toString("hex");
  if (state.auth.sponsorshipIntents.some((item) => item.status === "consumed" && item.hash === innerHash)) {
    throw conflict("Transaction replay detected.");
  }

  const sponsor = getSponsorKeypair();
  const feeBump = TransactionBuilder.buildFeeBumpTransaction(
    sponsor,
    config.sponsorBaseFee || BASE_FEE,
    innerTx,
    config.networkPassphrase,
  );
  feeBump.sign(sponsor);

  const response = await server.submitTransaction(feeBump);
  intent.status = "consumed";
  intent.hash = innerHash;
  intent.submittedAt = new Date().toISOString();
  intent.transactionHash = response.hash;
  repository.save();

  return {
    hash: response.hash,
    ledger: response.ledger,
    successful: response.successful,
    sponsor: sponsor.publicKey(),
  };
}
