import type { IconName } from "../components/ui/Icon";
import type { KinliiEvent } from "../data/kinliiData";
import type { EventFeedItem } from "../repositories/eventRepository";

const categoryPresentation: Record<string, { icon: IconName }> = {
  Sports: {
    icon: "racquet",
  },
  Outdoors: {
    icon: "trail",
  },
  Creative: {
    icon: "dance",
  },
};

function formatStartsAt(startsAt: string) {
  const starts = new Date(startsAt);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const sameDay = (left: Date, right: Date) =>
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate();

  const day = sameDay(starts, today)
    ? "Today"
    : sameDay(starts, tomorrow)
      ? "Tomorrow"
      : new Intl.DateTimeFormat(undefined, {
          weekday: "short",
          month: "short",
          day: "numeric",
        }).format(starts);
  const time = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(
    starts,
  );
  return `${day} · ${time}`;
}

export function toKinliiEvent(event: EventFeedItem): KinliiEvent {
  const presentation = categoryPresentation[event.category] ?? {
    icon: "sparkles" as IconName,
  };

  return {
    id: event.id,
    title: event.title,
    type: event.category,
    startsAt: event.startsAt,
    time: formatStartsAt(event.startsAt),
    place: event.locationName,
    distance: "Public meeting place",
    match: 90,
    spots: event.spotsRemaining,
    capacity: event.capacity,
    attendeeCount: event.attendeeCount,
    description: event.description,
    host: event.hostName || "Kinlii host",
    hostId: event.hostId,
    activityIcon: presentation.icon,
    tags: event.tags.length ? event.tags : [event.category],
  };
}

export function resolveEventStart(day: string, time: string) {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(day) ? new Date(`${day}T00:00:00`) : new Date();
  date.setSeconds(0, 0);

  if (day === "Tomorrow") date.setDate(date.getDate() + 1);
  if (!["Today", "Tomorrow"].includes(day)) {
    const weekday = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ].indexOf(day);
    if (weekday >= 0) {
      let daysAhead = (weekday - date.getDay() + 7) % 7;
      if (daysAhead === 0) daysAhead = 7;
      date.setDate(date.getDate() + daysAhead);
    }
  }

  const [hours, minutes] = time.split(":").map(Number);
  date.setHours(hours, minutes, 0, 0);
  if (day === "Today" && date.getTime() <= Date.now()) {
    throw new Error("Choose a time later today.");
  }
  return date.toISOString();
}
