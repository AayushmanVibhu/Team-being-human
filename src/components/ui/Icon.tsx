import type { ReactNode } from "react";

export type IconName =
  | "arrow"
  | "accessibility"
  | "bell"
  | "calendar"
  | "car"
  | "chat"
  | "check"
  | "chevron"
  | "clock"
  | "compass"
  | "heart"
  | "eye"
  | "ear"
  | "home"
  | "location"
  | "people"
  | "racquet"
  | "search"
  | "sparkles"
  | "star"
  | "trail"
  | "dance"
  | "volume"
  | "user";

export function Icon({
  name,
  size = 20,
  filled = false,
}: {
  name: IconName;
  size?: number;
  filled?: boolean;
}) {
  const paths: Record<IconName, ReactNode> = {
    accessibility: (
      <>
        <circle cx="12" cy="4" r="2" />
        <path d="M5 8h14M12 6v6m0 0-4 9m4-9 4 9M8 12h8" />
      </>
    ),
    arrow: <path d="m15 18-6-6 6-6" />,
    bell: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21h4" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 11h18" />
      </>
    ),
    car: (
      <>
        <path d="m5 17-2-2v-4l2-5h14l2 5v4l-2 2H5Z" />
        <path d="M5 17v3M19 17v3M3 12h18" />
        <circle cx="7" cy="14" r="1" />
        <circle cx="17" cy="14" r="1" />
      </>
    ),
    chat: (
      <>
        <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z" />
        <path d="M8 10h.01M12 10h.01M16 10h.01" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    chevron: <path d="m9 18 6-6-6-6" />,
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    compass: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" />
      </>
    ),
    heart: (
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.7-7.5 1.1-1.1a5.5 5.5 0 0 0 0-7.8Z" />
    ),
    eye: (
      <>
        <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
    ear: (
      <>
        <path d="M6 10a6 6 0 0 1 12 0c0 5-4 5-4 9a2 2 0 0 1-4 0" />
        <path d="M10 10a2 2 0 1 1 3 1.7c-1 .6-1 1.3-1 2.3" />
      </>
    ),
    home: (
      <>
        <path d="m3 11 9-8 9 8" />
        <path d="M5 10v10h14V10M9 20v-6h6v6" />
      </>
    ),
    location: (
      <>
        <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
    people: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" />
      </>
    ),
    racquet: (
      <>
        <ellipse cx="9" cy="8" rx="5" ry="6" transform="rotate(-35 9 8)" />
        <path d="m12 13 7 8M5.5 5l7 6M4.5 9l6.5-6" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    sparkles: (
      <>
        <path d="m12 3-1.4 3.6L7 8l3.6 1.4L12 13l1.4-3.6L17 8l-3.6-1.4L12 3Z" />
        <path d="m5 14-.8 2.2L2 17l2.2.8L5 20l.8-2.2L8 17l-2.2-.8L5 14Z" />
      </>
    ),
    star: (
      <path d="m12 2.5 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5-5.8-3-5.8 3 1.1-6.5-4.7-4.6 6.5-.9L12 2.5Z" />
    ),
    trail: (
      <>
        <path d="m3 20 6-10 4 6 3-5 5 9H3Z" />
        <path d="M12 20c0-3 2-3 2-6" />
        <circle cx="18" cy="5" r="2" />
      </>
    ),
    dance: (
      <>
        <circle cx="13" cy="4" r="2" />
        <path d="m9 21 2-7-3-3 3-4 4 2 3-1M11 14l4 3 1 4" />
      </>
    ),
    volume: (
      <>
        <path d="M11 5 6 9H2v6h4l5 4V5Z" />
        <path d="M15 9a4 4 0 0 1 0 6M18 6a8 8 0 0 1 0 12" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
