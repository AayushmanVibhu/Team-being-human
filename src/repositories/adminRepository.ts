import { requireSupabase } from "../lib/supabase";

export type AdminMetrics = {
  totalAccounts: number;
  eventCreators: number;
  eventJoiners: number;
};

type AdminMetricsRow = {
  total_accounts: number;
  event_creators: number;
  event_joiners: number;
};

export async function getAdminMetrics(): Promise<AdminMetrics | null> {
  const client = requireSupabase();
  const { data: isAdmin, error: accessError } = await client.rpc("is_kinlii_admin");
  if (accessError || !isAdmin) return null;

  const { data, error } = await client.rpc("get_admin_metrics").single();
  if (error) throw error;

  const metrics = data as AdminMetricsRow;
  return {
    totalAccounts: metrics.total_accounts,
    eventCreators: metrics.event_creators,
    eventJoiners: metrics.event_joiners,
  };
}
