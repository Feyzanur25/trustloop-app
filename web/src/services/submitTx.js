// web/src/services/submitTx.js
export async function submitToHorizon(signedXdr, network = "TESTNET") {
  const net = String(network || "TESTNET").toUpperCase();

  const horizon =
    net === "TESTNET"
      ? "https://horizon-testnet.stellar.org"
      : "https://horizon.stellar.org";

  const res = await fetch(`${horizon}/transactions`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ tx: signedXdr }),
  });

  // Horizon bazen JSON yerine text döndürür → güvenli parse
  const raw = await res.text().catch(() => "");
  let json = null;
  try {
    json = raw ? JSON.parse(raw) : null;
  } catch {
    json = null;
  }

  if (!res.ok) {
    // Horizon error shape: { title, detail, extras }
    const msg =
      json?.detail ||
      json?.title ||
      raw ||
      `Submit failed (${res.status})`;
    throw new Error(msg);
  }

  return json || { ok: true, raw };
}
