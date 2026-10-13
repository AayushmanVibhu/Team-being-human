export type Screen =
  | "welcome"
  | "verify"
  | "login"
  | "forgot-password"
  | "reset-password"
  | "set-password"
  | "profile-setup"
  | "interests"
  | "quiz"
  | "result"
  | "app";

export type Tab = "discover" | "calendar" | "alerts" | "profile";

export type Personality = {
  name: string;
  description: string;
  traits: string[];
  group: string;
};
