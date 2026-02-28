export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || "http://localhost:4000",
  sorobanRpcUrl: import.meta.env.VITE_SOROBAN_RPC_URL || "https://soroban-rpc.stellar.org",
  networkPassphrase: "Test SDF Network ; September 2015",
};
