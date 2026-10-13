import { requireSupabase } from "../lib/supabase";

export type EventFeedItem = {
  id: string;
  hostId: string;
  hostName: string;
  title: string;
  description: string;
  category: string;
  startsAt: string;
  locationName: string;
  latitude: number | null;
  longitude: number | null;
  capacity: number;
  attendeeCount: number;
  spotsRemaining: number;
  tags: string[];
};

type EventFeedRow = {
  id: string;
  host_id: string;
  host_name: string;
  title: string;
  description: string;
  category: string;
  starts_at: string;
  location_name: string;
  latitude: number | null;
  longitude: number | null;
  capacity: number;
  attendee_count: number;
  spots_remaining: number;
  tags: string[] | null;
};

function mapFeedRow(row: EventFeedRow): EventFeedItem {
  return {
    id: row.id,
    hostId: row.host_id,
    hostName: row.host_name,
    title: row.title,
    description: row.description,
    category: row.category,
    startsAt: row.starts_at,
    locationName: row.location_name,
    latitude: row.latitude,
    longitude: row.longitude,
    capacity: row.capacity,
    attendeeCount: row.attendee_count,
    spotsRemaining: row.spots_remaining,
    tags: row.tags ?? [],
  };
}

export async function listAvailableEvents(): Promise<EventFeedItem[]> {
  const client = requireSupabase();
  const { data, error } = await client.from("event_feed").select("*").order("starts_at");

  if (error) throw error;
  return ((data ?? []) as EventFeedRow[]).map(mapFeedRow);
}

export async function joinEvent(eventId: string) {
  const client = requireSupabase();
  const { data, error } = await client.rpc("join_event", { p_event_id: eventId }).single();

  if (error) throw error;
  return data;
}

export async function leaveEvent(eventId: string, reason: string) {
  const client = requireSupabase();
  const { data, error } = await client
    .rpc("leave_event", { p_event_id: eventId, p_reason: reason })
    .single();

  if (error) throw error;
  return data;
}

export async function saveEvent(eventId: string) {
  const client = requireSupabase();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) throw new Error("You must be signed in to save an event.");

  const { error } = await client
    .from("saved_events")
    .upsert({ event_id: eventId, user_id: user.id });
  if (error) throw error;
}

export async function unsaveEvent(eventId: string) {
  const client = requireSupabase();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) throw new Error("You must be signed in to remove a saved event.");

  const { error } = await client
    .from("saved_events")
    .delete()
    .eq("event_id", eventId)
    .eq("user_id", user.id);
  if (error) throw error;
}
