import { createClient } from "@supabase/supabase-js";

let supabase = null;

export function ensureSupabase() {
  if (supabase) return supabase;

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  supabase = createClient(supabaseUrl, supabaseKey);
  return supabase;
}

export async function upsertClaimDecision(record) {
  const client = ensureSupabase();
  const { data, error } = await client
    .from("claims")
    .upsert(record, { onConflict: "claim_id" })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function listClaims(limit = 50) {
  const client = ensureSupabase();
  const { data, error } = await client
    .from("claims")
    .select(
      "claim_id,email,eligibility_status,risk_level,claim_code,match_level,image_location,geo_tagged,policy_owner_name,policy_bike_number,policy_land_location,fir_incident,fir_bike_number,fir_location,admin_decision,admin_notes,created_at,updated_at"
    )
    .order("created_at", { ascending: false })
    .limit(Number.isFinite(limit) ? limit : 50);

  if (error) throw error;
  return data;
}

export async function updateAdminDecision(claimId, update) {
  const client = ensureSupabase();
  const { data, error } = await client
    .from("claims")
    .update({ ...update, updated_at: new Date().toISOString() })
    .eq("claim_id", claimId)
    .select()
    .single();

  if (error) throw error;
  return data;
}
