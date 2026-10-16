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

const weekdayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function formatRecurringSchedule(days: number[], startsAt: string) {
  const time = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(
    new Date(startsAt),
  );
  const dayNames = days.map((day) => weekdayNames[day]).filter(Boolean);
  return `Every ${dayNames.join(" & ")} · ${time}`;
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
    time: event.recurrenceDays.length
      ? formatRecurringSchedule(event.recurrenceDays, event.startsAt)
      : formatStartsAt(event.startsAt),
    place: event.locationName,
    distance: "Public meeting place",
    spots: event.spotsRemaining,
    capacity: event.capacity,
    attendeeCount: event.attendeeCount,
    description: event.description,
    host: event.hostName || "Kinlii host",
    hostId: event.hostId,
    activityIcon: presentation.icon,
    tags: event.tags.length ? event.tags : [event.category],
    recurrenceDays: event.recurrenceDays,
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

export function resolveRecurringEventStart(days: number[], time: string) {
  if (!days.length) throw new Error("Choose at least one recurring day.");
  const now = new Date();
  const [hours, minutes] = time.split(":").map(Number);
  const candidates = days.map((weekday) => {
    const date = new Date(now);
    let daysAhead = (weekday - now.getDay() + 7) % 7;
    date.setDate(now.getDate() + daysAhead);
    date.setHours(hours, minutes, 0, 0);
    if (date.getTime() <= now.getTime()) {
      daysAhead += 7;
      date.setDate(now.getDate() + daysAhead);
    }
    return date;
  });
  return new Date(Math.min(...candidates.map((date) => date.getTime()))).toISOString();
}
