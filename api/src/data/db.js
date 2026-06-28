import { createClient } from "@supabase/supabase-js";

function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const supabaseUrl = getRequiredEnv("SUPABASE_URL");
// anon is used for public reads; service role is used for writes.
const supabaseAnonKey = getRequiredEnv("SUPABASE_ANON_KEY");
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
});

export const supabaseAdmin = supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false },
    })
  : null;

function requireAdmin() {
  if (!supabaseAdmin) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for write operations.");
  }
  return supabaseAdmin;
}

export async function upsertRow(table, payload) {
  // Uses primary key via `onConflict`.
  const admin = requireAdmin();
  const { data, error } = await admin
    .from(table)
    .upsert(payload, { onConflict: "id" })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function insertRow(table, payload) {
  const admin = requireAdmin();
  const { data, error } = await admin.from(table).insert(payload).select().single();
  if (error) throw error;
  return data;
}

export async function updateRow(table, id, patch) {
  const admin = requireAdmin();
  const { data, error } = await admin.from(table).update(patch).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteRow(table, id) {
  const admin = requireAdmin();
  const { error } = await admin.from(table).delete().eq("id", id);
  if (error) throw error;
}

export async function selectAll(table, orderBy = null) {
  const { data, error } = await supabaseAnon.from(table).select(orderBy ? `*` : "*");
  if (error) throw error;
  return data ?? [];
}

export async function selectById(table, id) {
  const { data, error } = await supabaseAnon.from(table).select().eq("id", id).single();
  if (error) {
    // supabase uses PGRST116 for not found; keep it consistent for callers
    if (String(error.code) === "PGRST116") return null;
    throw error;
  }
  return data;
}

export async function selectBy(table, column, value, orderBy = null) {
  let q = supabaseAnon.from(table).select("*").eq(column, value);
  if (orderBy) q = q.order(orderBy.column, { ascending: orderBy.ascending });
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

