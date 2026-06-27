import { loadState, commitState } from "./store.js";
import { addEvent as addEventToArray, refreshLoopScores } from "../logic/trustScore.js";

let state = loadState();

export function getState() {
  return state;
}

export function setState(nextState) {
  state = nextState;
  commitState(state);
}

export function touchIndexerSync() {
  state.meta.lastIndexerSyncAt = new Date().toISOString();
}

export function addEvent(type, loopId, detail) {
  addEventToArray(state.events, type, loopId, detail);
  touchIndexerSync();
}

export function refreshLoopScoresInState() {
  state.loops = refreshLoopScores(state.loops, state.approvals);
}

export function importLocalState(nextRaw) {
  const normalized = require("./seed.js").normalizeState(nextRaw);
  state = normalized;
  commitState(state);
  return state;
}