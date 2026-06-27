import fs from "fs";
import { ensureDir, getDataPaths } from "../utils/helpers.js";
import { normalizeState, buildSeedState } from "./seed.js";

const { DATA_DIR, DATA_FILE } = getDataPaths();

export function saveState(nextState) {
  ensureDir(DATA_DIR);
  fs.writeFileSync(DATA_FILE, JSON.stringify(nextState, null, 2), "utf8");
}

export function loadState() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      const seed = normalizeState(buildSeedState());
      saveState(seed);
      return seed;
    }

    const raw = fs.readFileSync(DATA_FILE, "utf8");
    const parsed = raw ? JSON.parse(raw) : {};
    const normalized = normalizeState(parsed);
    saveState(normalized);
    return normalized;
  } catch (error) {
    console.error("Failed to load persisted state, using seed data:", error.message);
    const seed = normalizeState(buildSeedState());
    saveState(seed);
    return seed;
  }
}

export function commitState(state) {
  saveState(state);
}