export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || "",
  network: String(import.meta.env.VITE_STELLAR_NETWORK || "MAINNET").toUpperCase(),
  horizonUrl: import.meta.env.VITE_STELLAR_HORIZON_URL || "https://horizon.stellar.org",
  sorobanRpcUrl:
    import.meta.env.VITE_SOROBAN_RPC_URL || "https://mainnet.sorobanrpc.com",
  networkPassphrase:
    String(import.meta.env.VITE_STELLAR_NETWORK || "MAINNET").toUpperCase() === "TESTNET"
      ? "Test SDF Network ; September 2015"
      : "Public Global Stellar Network ; September 2015",
  brand: {
    name: import.meta.env.VITE_BRAND_NAME || "TrustLoop",
    tagline: import.meta.env.VITE_BRAND_TAGLINE || "On-chain workflow intelligence",
    logoUrl: import.meta.env.VITE_BRAND_LOGO_URL || "",
    bannerUrl: import.meta.env.VITE_BRAND_BANNER_URL || "",
    website: import.meta.env.VITE_BRAND_WEBSITE || "https://trustloop.example",
    primaryColor: import.meta.env.VITE_BRAND_PRIMARY_COLOR || "#10b981",
    logoAlt: import.meta.env.VITE_BRAND_LOGO_ALT || "TrustLoop logo",
  },
};
