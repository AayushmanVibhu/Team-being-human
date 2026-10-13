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

export type CreateEventInput = {
  title: string;
  category: string;
  startsAt: string;
  locationName: string;
  capacity: number;
  description?: string;
};

export async function createEvent(input: CreateEventInput): Promise<string> {
  const client = requireSupabase();
  const description =
    input.description?.trim() ||
    `A small ${input.category.toLowerCase()} activity hosted on Kinlii.`;
  const { data, error } = await client.rpc("create_event", {
    p_title: input.title.trim(),
    p_description: description,
    p_category: input.category,
    p_starts_at: input.startsAt,
    p_location_name: input.locationName.trim(),
    p_capacity: input.capacity,
    p_tags: [input.category, "New activity"],
  });

  if (error) throw error;
  return data as string;
}

export async function listMyJoinedEventIds(): Promise<string[]> {
  const client = requireSupabase();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return [];

  const { data, error } = await client
    .from("event_members")
    .select("event_id")
    .eq("user_id", user.id)
    .eq("status", "confirmed");
  if (error) throw error;
  return (data ?? []).map((membership) => membership.event_id as string);
}

export async function listHostedEvents(hostId: string, hostName: string): Promise<EventFeedItem[]> {
  const client = requireSupabase();
  const { data: hostedEvents, error } = await client
    .from("events")
    .select(
      "id, host_id, title, description, category, starts_at, location_name, latitude, longitude, capacity, tags",
    )
    .eq("host_id", hostId)
    .eq("status", "active")
    .gt("starts_at", new Date().toISOString())
    .order("starts_at");
  if (error) throw error;
  if (!hostedEvents?.length) return [];

  const eventIds = hostedEvents.map((event) => event.id as string);
  const { data: memberships, error: membershipError } = await client
    .from("event_members")
    .select("event_id")
    .in("event_id", eventIds)
    .eq("status", "confirmed");
  if (membershipError) throw membershipError;

  const attendeeCounts = new Map<string, number>();
  memberships?.forEach((membership) => {
    const eventId = membership.event_id as string;
    attendeeCounts.set(eventId, (attendeeCounts.get(eventId) ?? 0) + 1);
  });

  return hostedEvents.map((event) => {
    const attendeeCount = attendeeCounts.get(event.id as string) ?? 0;
    return {
      id: event.id as string,
      hostId: event.host_id as string,
      hostName,
      title: event.title as string,
      description: event.description as string,
      category: event.category as string,
      startsAt: event.starts_at as string,
      locationName: event.location_name as string,
      latitude: event.latitude as number | null,
      longitude: event.longitude as number | null,
      capacity: event.capacity as number,
      attendeeCount,
      spotsRemaining: (event.capacity as number) - attendeeCount,
      tags: (event.tags as string[] | null) ?? [],
    };
  });
}

export async function joinEvent(eventId: string) {
  const client = requireSupabase();
  const { data, error } = await client.rpc("join_event", { p_event_id: eventId }).single();

  if (error) throw error;
  return data as { event_id: string; attendee_count: number; spots_remaining: number };
}

export async function leaveEvent(eventId: string, reason: string) {
  const client = requireSupabase();
  const { data, error } = await client
    .rpc("leave_event", { p_event_id: eventId, p_reason: reason })
    .single();

  if (error) throw error;
  return data as { event_id: string; attendee_count: number; spots_remaining: number };
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
