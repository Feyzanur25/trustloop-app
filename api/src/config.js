import crypto from "crypto";

const TESTNET = {
  label: "testnet",
  passphrase: "Test SDF Network ; September 2015",
  horizonUrl: "https://horizon-testnet.stellar.org",
  friendbotUrl: "https://friendbot.stellar.org",
  allowFriendbot: true,
};

const MAINNET = {
  label: "mainnet",
  passphrase: "Public Global Stellar Network ; September 2015",
  horizonUrl: "https://horizon.stellar.org",
  friendbotUrl: "",
  allowFriendbot: false,
};

function parseCsv(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeNetwork(value) {
  const network = String(value || "MAINNET").toUpperCase();
  return network === "TESTNET" ? "TESTNET" : "MAINNET";
}

const selectedNetwork = normalizeNetwork(process.env.STELLAR_NETWORK);
const defaults = selectedNetwork === "TESTNET" ? TESTNET : MAINNET;

export const config = {
  appName: process.env.APP_NAME || "TrustLoop",
  appUrl: process.env.APP_URL || "http://localhost:5173",
  apiUrl: process.env.API_URL || "http://localhost:4000",
  nodeEnv: process.env.NODE_ENV || "development",
  isProduction: (process.env.NODE_ENV || "development") === "production",
  port: Number(process.env.PORT || 4000),
  logLevel: process.env.LOG_LEVEL || "info",
  allowedOrigins: parseCsv(process.env.ALLOWED_ORIGINS || process.env.APP_URL || "http://localhost:5173"),
  storageDriver: String(process.env.STORAGE_DRIVER || "file").toLowerCase(),
  dataFilePath: process.env.DATA_FILE_PATH || "api/data/store.json",
  sessionTtlMinutes: Number(process.env.SESSION_TTL_MINUTES || 720),
  challengeTtlSeconds: Number(process.env.CHALLENGE_TTL_SECONDS || 300),
  sponsorshipIntentTtlSeconds: Number(process.env.SPONSORSHIP_INTENT_TTL_SECONDS || 300),
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000),
  rateLimitMaxRequests: Number(process.env.RATE_LIMIT_MAX_REQUESTS || 120),
  sponsorshipDailyLimit: Number(process.env.SPONSORSHIP_DAILY_LIMIT || 25),
  authTokenBytes: Number(process.env.AUTH_TOKEN_BYTES || 32),
  network: selectedNetwork,
  networkLabel: defaults.label,
  networkPassphrase: process.env.STELLAR_NETWORK_PASSPHRASE || defaults.passphrase,
  horizonUrl: process.env.STELLAR_HORIZON_URL || defaults.horizonUrl,
  friendbotUrl: process.env.STELLAR_FRIENDBOT_URL || defaults.friendbotUrl,
  allowFriendbot: defaults.allowFriendbot,
  sponsorSecretKey: process.env.STELLAR_SPONSOR_SECRET_KEY || "",
  sponsorPublicKey: process.env.STELLAR_SPONSOR_PUBLIC_KEY || "",
  sponsorBaseFee: String(process.env.STELLAR_BASE_FEE || "100"),
  webAuthDomain: process.env.STELLAR_WEB_AUTH_DOMAIN || "localhost",
  homeDomain: process.env.STELLAR_HOME_DOMAIN || "localhost",
  challengeSecretKey: process.env.STELLAR_CHALLENGE_SECRET_KEY || process.env.STELLAR_SPONSOR_SECRET_KEY || "",
  challengeNetworkTimeout: Number(process.env.STELLAR_CHALLENGE_TIMEOUT_SECONDS || 300),
  enableSponsorship: String(process.env.ENABLE_FEE_SPONSORSHIP || "true").toLowerCase() === "true",
  supabaseUrl: process.env.SUPABASE_URL || "",
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
};

export function assertConfig() {
  const issues = [];

  if (!config.allowedOrigins.length) {
    issues.push("ALLOWED_ORIGINS must include at least one origin.");
  }

  if (config.enableSponsorship) {
    if (!config.sponsorSecretKey) {
      issues.push("STELLAR_SPONSOR_SECRET_KEY is required when ENABLE_FEE_SPONSORSHIP=true.");
    }
    if (!config.challengeSecretKey) {
      issues.push("STELLAR_CHALLENGE_SECRET_KEY is required for wallet authentication.");
    }
  }

  return issues;
}

export function createOpaqueToken() {
  return crypto.randomBytes(config.authTokenBytes).toString("hex");
}
