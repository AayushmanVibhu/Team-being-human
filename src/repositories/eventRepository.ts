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
  imageUrl: string | null;
  recurrenceDays: number[];
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
  image_url: string | null;
  recurrence_days: number[] | null;
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
    imageUrl: row.image_url,
    recurrenceDays: row.recurrence_days ?? [],
  };
}

export async function listAvailableEvents(): Promise<EventFeedItem[]> {
  const client = requireSupabase();
  const { data, error } = await client.from("event_feed").select("*").order("starts_at");

  if (error) throw error;
  return ((data ?? []) as EventFeedRow[]).map(mapFeedRow);
}

export async function listEventCatalog(): Promise<EventFeedItem[]> {
  const client = requireSupabase();
  const { data, error } = await client.from("event_catalog").select("*").order("starts_at");
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
  recurrenceDays?: number[];
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
    p_recurrence_days: input.recurrenceDays ?? [],
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

export async function listMySavedEventIds(): Promise<string[]> {
  const client = requireSupabase();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return [];
  const { data, error } = await client
    .from("saved_events")
    .select("event_id")
    .eq("user_id", user.id);
  if (error) throw error;
  return (data ?? []).map((item) => item.event_id as string);
}

export async function updateEvent(eventId: string, input: CreateEventInput): Promise<void> {
  const { error } = await requireSupabase()
    .from("events")
    .update({
      title: input.title.trim(),
      description: input.description?.trim() || "",
      category: input.category,
      starts_at: input.startsAt,
      location_name: input.locationName.trim(),
      capacity: input.capacity,
      tags: [input.category],
      recurrence_days: input.recurrenceDays ?? [],
    })
    .eq("id", eventId);
  if (error) throw error;
}

export async function cancelEvent(eventId: string): Promise<void> {
  const { error } = await requireSupabase()
    .from("events")
    .update({ status: "cancelled" })
    .eq("id", eventId);
  if (error) throw error;
}

export async function uploadEventImage(
  userId: string,
  eventId: string,
  image: File,
): Promise<string> {
  const client = requireSupabase();
  const extension = image.name.split(".").pop()?.toLowerCase() || "jpg";
  const objectPath = `${userId}/${eventId}.${extension}`;
  const { error: uploadError } = await client.storage
    .from("event-images")
    .upload(objectPath, image, {
      contentType: image.type,
      cacheControl: "3600",
      upsert: true,
    });
  if (uploadError) throw uploadError;
  const { data } = client.storage.from("event-images").getPublicUrl(objectPath);
  const imageUrl = `${data.publicUrl}?v=${Date.now()}`;
  const { error } = await client.from("events").update({ image_url: imageUrl }).eq("id", eventId);
  if (error) throw error;
  return imageUrl;
}

export async function listHostedEvents(hostId: string, hostName: string): Promise<EventFeedItem[]> {
  const client = requireSupabase();
  const { data: hostedEvents, error } = await client
    .from("events")
    .select(
      "id, host_id, title, description, category, starts_at, location_name, latitude, longitude, capacity, tags, image_url, recurrence_days",
    )
    .eq("host_id", hostId)
    .eq("status", "active")
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

  return hostedEvents
    .filter(
      (event) =>
        ((event.recurrence_days as number[] | null) ?? []).length > 0 ||
        new Date(event.starts_at as string).getTime() > Date.now(),
    )
    .map((event) => {
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
        imageUrl: event.image_url as string | null,
        recurrenceDays: (event.recurrence_days as number[] | null) ?? [],
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
