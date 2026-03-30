// src/services/wallet.js
import {
  isConnected,
  requestAccess,
  getAddress,
  getNetworkDetails,
  signTransaction,
} from "@stellar/freighter-api";

const TESTNET_PASSPHRASE = "Test SDF Network ; September 2015";
const STORAGE_KEY = "trustloop_wallet_pk";

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
    throw new Error(
      "Freighter yüklü değil. Extension'ı kur ve tarayıcıda aktif et."
    );
  }

  const net = await getNetworkDetails();
  if (net?.error) throw new Error(net.error);

  // Kullanıcı Freighter'da PUBLIC seçtiyse burada yakala
  if (net?.networkPassphrase && net.networkPassphrase !== TESTNET_PASSPHRASE) {
    throw new Error(
      "Freighter ağını TESTNET'e al (Freighter > Settings > Network)."
    );
  }

  const access = await requestAccess();
  if (access?.error) throw new Error(access.error);
  if (!access?.address) throw new Error("Freighter address alınamadı.");

  localStorage.setItem(STORAGE_KEY, access.address);
  return access.address;
}

export function disconnectWallet() {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * xdr: base64 XDR string
 * network: "TESTNET" | "PUBLIC"
 *
 * ✅ Kritik: Freighter bazen string bazen object döndürür.
 * Biz her koşulda base64 XDR string döndürüyoruz.
 */
export async function signXdr(xdr, network = "TESTNET") {
  if (!xdr || typeof xdr !== "string") {
    throw new Error("signXdr: xdr base64 string olmalı.");
  }

  const networkPassphrase =
    network === "TESTNET"
      ? TESTNET_PASSPHRASE
      : "Public Global Stellar Network ; September 2015";

  const res = await signTransaction(xdr, { networkPassphrase });

  // 1) Bazı sürümler direkt string döndürür
  if (typeof res === "string") return res;

  // 2) Bazıları object döndürür
  const signed =
    res?.signedTransaction || // senin mevcut kullanımın
    res?.signedTxXdr ||
    res?.signedXdr ||
    res?.xdr;

  if (!signed || typeof signed !== "string") {
    console.error("Freighter signTransaction response:", res);
    throw new Error("Signed XDR alınamadı (Freighter dönüşü beklenenden farklı).");
  }

  return signed;
}