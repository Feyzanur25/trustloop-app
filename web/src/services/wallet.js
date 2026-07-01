import {
  isConnected,
  requestAccess,
  getAddress,
  getNetworkDetails,
  signTransaction,
} from "@stellar/freighter-api";
import { http } from "./http";
import { config } from "../lib/config";

const TESTNET_PASSPHRASE = "Test SDF Network ; September 2015";
const PUBLIC_PASSPHRASE = "Public Global Stellar Network ; September 2015";
const STORAGE_KEY = "trustloop_wallet_pk";
const SESSION_KEY = "trustloop_session_token";
const SESSION_EXP_KEY = "trustloop_session_expiry";

export async function getConnectedWallet() {
  const conn = await isConnected();
  if (!conn?.isConnected) return null;

  const cached = localStorage.getItem(STORAGE_KEY);
  if (cached) return cached;

  try {
    const res = await getAddress();
    if (res?.address) {
      localStorage.setItem(STORAGE_KEY, res.address);
      return res.address;
    }
  } catch {
    // ignore
  }

  return null;
}

export async function connectWallet() {
  const conn = await isConnected();
  if (!conn?.isConnected) {
    throw new Error("Freighter is not available. Install the extension and enable it in the browser.");
  }

  const net = await getNetworkDetails();
  if (net?.error) throw new Error(net.error);

  if (net?.networkPassphrase && net.networkPassphrase !== config.networkPassphrase) {
    const expected = config.network === "TESTNET" ? "TESTNET" : "MAINNET";
    throw new Error(`Freighter must be switched to ${expected} in Settings > Network.`);
  }

  const access = await requestAccess();
  if (access?.error) throw new Error(access.error);
  if (!access?.address) throw new Error("Freighter address could not be read.");

  localStorage.setItem(STORAGE_KEY, access.address);
  return access.address;
}

export function disconnectWallet() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(SESSION_EXP_KEY);
}

export function getSessionToken() {
  const token = localStorage.getItem(SESSION_KEY);
  const expiresAt = localStorage.getItem(SESSION_EXP_KEY);
  if (!token || !expiresAt) return null;
  if (Date.parse(expiresAt) <= Date.now()) {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_EXP_KEY);
    return null;
  }
  return token;
}

export async function signXdr(xdr, network = config.network) {
  if (!xdr || typeof xdr !== "string") {
    throw new Error("signXdr: xdr must be a base64 string.");
  }

  const networkPassphrase =
    network === "TESTNET" ? TESTNET_PASSPHRASE : PUBLIC_PASSPHRASE;

  const res = await signTransaction(xdr, { networkPassphrase });

  if (typeof res === "string") return res;

  const signed =
    res?.signedTransaction ||
    res?.signedTxXdr ||
    res?.signedXdr ||
    res?.xdr;

  if (!signed || typeof signed !== "string") {
    console.error("Freighter signTransaction response:", res);
    throw new Error("Signed XDR could not be read from the Freighter response.");
  }

  return signed;
}

export async function authenticateWallet() {
  const walletAddress = await connectWallet();
  const existingToken = getSessionToken();
  if (existingToken) {
    return { walletAddress, token: existingToken };
  }

  const challenge = await http("/api/auth/challenge", {
    method: "POST",
    body: JSON.stringify({ walletAddress }),
  });
  const signedXdr = await signXdr(challenge.xdr, config.network);
  const session = await http("/api/auth/verify", {
    method: "POST",
    body: JSON.stringify({
      challengeId: challenge.challengeId,
      signedXdr,
    }),
  });

  localStorage.setItem(SESSION_KEY, session.token);
  localStorage.setItem(SESSION_EXP_KEY, session.expiresAt);
  return session;
}
