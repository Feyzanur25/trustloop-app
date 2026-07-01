import {
  deleteRow,
  insertRow,
  selectAll,
  upsertRow,
} from "./db.js";
import { normalizeState } from "./seed.js";

async function ensureDbSeeded() {
  await selectAll("meta");
}

function normalizeDbLoopRow(row) {
  return {
    id: row.id,
    counterparty: row.counterparty,
    role: row.role,
    status: row.status,
    score: Number(row.score ?? 0),
    expiresInDays: Number(row.expires_in_days ?? 14),
    lastEvent: row.last_event,
    createdAt: row.created_at,
    approvalPolicy: row.approval_policy,
    lastUpdatedAt: row.updated_at,
  };
}

function normalizeDbApprovalRow(loopId, row) {
  return {
    loopId,
    clientApproved: Boolean(row.client_approved),
    freelancerApproved: Boolean(row.freelancer_approved),
    requiredApprovals: Number(row.required_approvals ?? 2),
    updatedAt: row.updated_at,
  };
}

function normalizeDbEventRow(row) {
  return {
    id: row.id,
    type: row.type,
    loopId: row.loop_id,
    detail: row.detail,
    createdAt: row.created_at,
  };
}

function normalizeDbOnboardingProfileRow(row) {
  return {
    id: row.id,
    createdAt: row.created_at,
    name: row.name,
    email: row.email,
    walletAddress: row.wallet_address,
    walletShort: row.wallet_short,
    feedback: row.feedback,
    productRating: Number(row.product_rating ?? 4),
  };
}

export async function getStateFromDb() {
  await ensureDbSeeded();

  const [loopsRows, approvalsRows, eventsRows, onboardingRows, metaRows] = await Promise.all([
    selectAll("loops"),
    selectAll("approvals"),
    selectAll("events"),
    selectAll("onboarding_profiles"),
    selectAll("meta"),
  ]);

  const loops = (loopsRows ?? []).map(normalizeDbLoopRow);
  const approvals = {};
  for (const row of approvalsRows ?? []) {
    approvals[row.loop_id] = normalizeDbApprovalRow(row.loop_id, row);
  }

  const events = (eventsRows ?? []).map(normalizeDbEventRow);
  const onboardingProfiles = (onboardingRows ?? []).map(normalizeDbOnboardingProfileRow);
  const metaRow = (metaRows ?? [])[0];

  return normalizeState({
    loops,
    approvals,
    events,
    onboardingProfiles,
    meta: {
      lastIndexerSyncAt: metaRow?.last_indexer_sync_at ?? new Date().toISOString(),
    },
  });
}

export async function commitStateToDb(nextState) {
  const state = normalizeState(nextState);

  for (const loop of state.loops) {
    await upsertRow("loops", {
      id: loop.id,
      counterparty: loop.counterparty,
      role: loop.role,
      status: loop.status,
      score: loop.score,
      expires_in_days: loop.expiresInDays,
      last_event: loop.lastEvent,
      created_at: loop.createdAt,
      updated_at: loop.lastUpdatedAt || loop.createdAt,
      approval_policy: loop.approvalPolicy,
    });
  }

  for (const loopId of Object.keys(state.approvals ?? {})) {
    const approval = state.approvals[loopId];
    await upsertRow("approvals", {
      id: `AP-${loopId}`,
      loop_id: loopId,
      client_approved: approval.clientApproved,
      freelancer_approved: approval.freelancerApproved,
      required_approvals: approval.requiredApprovals,
      updated_at: approval.updatedAt,
    });
  }

  await upsertRow("meta", {
    id: "meta-0",
    last_indexer_sync_at: state.meta?.lastIndexerSyncAt,
  });

  const existingEvents = await selectAll("events");
  for (const row of existingEvents) {
    await deleteRow("events", row.id);
  }
  for (const event of state.events) {
    await insertRow("events", {
      id: event.id,
      time: event.createdAt,
      type: event.type,
      loop_id: event.loopId,
      detail: typeof event.detail === "string" ? event.detail : JSON.stringify(event.detail ?? {}),
    });
  }

  const existingOnboarding = await selectAll("onboarding_profiles");
  for (const row of existingOnboarding) {
    await deleteRow("onboarding_profiles", row.id);
  }
  for (const profile of state.onboardingProfiles) {
    await insertRow("onboarding_profiles", {
      id: profile.id,
      created_at: profile.createdAt,
      name: profile.name,
      email: profile.email,
      wallet_address: profile.walletAddress,
      wallet_short: profile.walletShort,
      feedback: profile.feedback,
      product_rating: profile.productRating,
    });
  }
}
