import {
  deleteRow,
  insertRow,
  selectAll,
  selectBy,
  selectById,
  updateRow,
  upsertRow,
} from "./db.js";

import { normalizeState } from "./seed.js";

async function ensureDbSeeded() {
  // Lightweight “seeded” check. We rely on schema.sql to create tables.
  // If onboarding_profiles is empty, seed.sql should be executed manually during setup.
  // This function remains as a placeholder for compatibility.
  // (Vercel best practice: keep runtime simple + idempotent.)
  await selectAll("meta");
}

function normalizeDbMetaRow(row) {
  return {
    id: String(row.id),
    lastIndexerSyncAt: row.last_indexer_sync_at || new Date().toISOString(),
  };
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
    // used by trustScore.js helpers
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
  for (const a of approvalsRows ?? []) {
    approvals[a.loop_id] = normalizeDbApprovalRow(a.loop_id, a);
  }

  const events = (eventsRows ?? []).map(normalizeDbEventRow);
  const onboardingProfiles = (onboardingRows ?? []).map(normalizeDbOnboardingProfileRow);

  const meta0 = (metaRows ?? [])[0];
  const lastIndexerSyncAt =
    meta0?.last_indexer_sync_at ?? new Date().toISOString();

  return normalizeState({
    loops,
    approvals,
    events,
    onboardingProfiles,
    meta: { lastIndexerSyncAt },
  });
}

export async function commitStateToDb(nextState) {
  // Idempotent-ish approach for now:
  // - Upsert loops
  // - Upsert approvals
  // - Replace events + onboardingProfiles + meta via delete+insert
  // This preserves business logic without trying to compute deltas.
  // (For production scaling, switch to proper incremental updates.)

  const state = normalizeState(nextState);

  // loops
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

  // approvals
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

  // meta
  await upsertRow("meta", {
    id: "meta-0",
    last_indexer_sync_at: state.meta?.lastIndexerSyncAt,
  });

  // events replace
    // delete all + insert all (simple + correct)
  const existingEvents = await selectAll("events");
  for (const e of existingEvents) {
    await deleteRow("events", e.id);
  }
  for (const ev of state.events) {
    await insertRow("events", {
      id: ev.id,
      time: ev.createdAt,
      type: ev.type,
      loop_id: ev.loopId,
      detail:
        typeof ev.detail === "string" ? ev.detail : JSON.stringify(ev.detail ?? {}),
    });
  }



  // onboardingProfiles replace
  const existingOnboarding = await selectAll("onboarding_profiles");
  for (const p of existingOnboarding) {
    await deleteRow("onboarding_profiles", p.id);
  }
  for (const p of state.onboardingProfiles) {
    await insertRow("onboarding_profiles", {
      id: p.id,
      created_at: p.createdAt,
      name: p.name,
      email: p.email,
      wallet_address: p.walletAddress,
      wallet_short: p.walletShort,
      feedback: p.feedback,
      product_rating: p.productRating,
    });
  }
}

