import { addEvent as addEventToArray, refreshLoopScores } from "../logic/trustScore.js";
import { getStateFromDb, commitStateToDb } from "./stateStore.js";

let statePromise = getStateFromDb();

export function getStateAsync() {
  statePromise = statePromise || getStateFromDb();
  return statePromise;
}

export async function setState(nextState) {
  // Keep cache updated for subsequent operations.
  statePromise = Promise.resolve(nextState);
  await commitStateToDb(nextState);
}

export async function touchIndexerSync() {
  const state = await getStateAsync();
  state.meta.lastIndexerSyncAt = new Date().toISOString();
  await setState(state);
}

export async function addEvent(type, loopId, detail) {
  const state = await getStateAsync();
  addEventToArray(state.events, type, loopId, detail);
  await touchIndexerSync();
}

export async function refreshLoopScoresInState() {
  const state = await getStateAsync();
  state.loops = refreshLoopScores(state.loops, state.approvals);
  await setState(state);
}

export async function importLocalState(nextRaw) {
  const { normalizeState } = await import("./seed.js");
  const normalized = normalizeState(nextRaw);
  await setState(normalized);
  return normalized;
}

