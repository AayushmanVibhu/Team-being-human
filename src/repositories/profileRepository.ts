import { requireSupabase } from "../lib/supabase";

export type UserProfile = {
  id: string;
  displayName: string;
  universityName: string;
  emailDomain: string;
  bio: string;
  avatarUrl: string | null;
  onboardingCompleted: boolean;
  passwordSet: boolean;
  accessibilityPreferences: Record<string, boolean>;
  personalityResult: Record<string, unknown>;
};

type ProfileRow = {
  id: string;
  display_name: string;
  university_name: string;
  email_domain: string;
  bio: string;
  avatar_url: string | null;
  onboarding_completed: boolean;
  password_set: boolean;
  accessibility_preferences: Record<string, boolean> | null;
  personality_result: Record<string, unknown> | null;
};

const profileColumns =
  "id, display_name, university_name, email_domain, bio, avatar_url, onboarding_completed, password_set, accessibility_preferences, personality_result";

function mapProfile(row: ProfileRow): UserProfile {
  return {
    id: row.id,
    displayName: row.display_name,
    universityName: row.university_name,
    emailDomain: row.email_domain,
    bio: row.bio,
    avatarUrl: row.avatar_url,
    onboardingCompleted: row.onboarding_completed,
    passwordSet: row.password_set,
    accessibilityPreferences: row.accessibility_preferences ?? {},
    personalityResult: row.personality_result ?? {},
  };
}

export async function markPasswordSet(userId: string): Promise<void> {
  const { error } = await requireSupabase()
    .from("profiles")
    .update({ password_set: true })
    .eq("id", userId);
  if (error) throw error;
}

export async function uploadProfileAvatar(userId: string, image: Blob): Promise<string> {
  const client = requireSupabase();
  const objectPath = `${userId}/avatar.jpg`;
  const { error: uploadError } = await client.storage.from("avatars").upload(objectPath, image, {
    contentType: "image/jpeg",
    cacheControl: "3600",
    upsert: true,
  });
  if (uploadError) throw uploadError;

  const { data } = client.storage.from("avatars").getPublicUrl(objectPath);
  const avatarUrl = `${data.publicUrl}?v=${Date.now()}`;
  const { error: profileError } = await client
    .from("profiles")
    .update({ avatar_url: avatarUrl })
    .eq("id", userId);
  if (profileError) throw profileError;
  return avatarUrl;
}

export async function getProfile(userId: string): Promise<UserProfile> {
  const { data, error } = await requireSupabase()
    .from("profiles")
    .select(profileColumns)
    .eq("id", userId)
    .single();

  if (error) throw error;
  return mapProfile(data as ProfileRow);
}

export async function updateProfile(
  userId: string,
  values: { displayName: string; universityName: string; bio: string },
): Promise<UserProfile> {
  const { data, error } = await requireSupabase()
    .from("profiles")
    .update({
      display_name: values.displayName.trim(),
      university_name: values.universityName.trim(),
      bio: values.bio.trim(),
    })
    .eq("id", userId)
    .select(profileColumns)
    .single();

  if (error) throw error;
  return mapProfile(data as ProfileRow);
}

export async function getProfileInterests(userId: string): Promise<string[]> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("profile_interests")
    .select("interests(name)")
    .eq("profile_id", userId);
  if (error) throw error;
  return (data ?? []).flatMap((row) => {
    const value = row.interests as unknown as { name: string } | { name: string }[] | null;
    if (Array.isArray(value)) return value.map((interest) => interest.name);
    return value?.name ? [value.name] : [];
  });
}

export async function updateProfilePreferences(
  userId: string,
  accessibilityPreferences: Record<string, boolean>,
): Promise<void> {
  const { error } = await requireSupabase()
    .from("profiles")
    .update({ accessibility_preferences: accessibilityPreferences })
    .eq("id", userId);
  if (error) throw error;
}

export async function completeOnboarding(
  userId: string,
  interestNames: string[],
  personalityResult?: Record<string, unknown>,
) {
  const client = requireSupabase();
  const { data: interests, error: interestError } = await client
    .from("interests")
    .select("id, name")
    .in("name", interestNames);

  if (interestError) throw interestError;

  const { error: deleteError } = await client
    .from("profile_interests")
    .delete()
    .eq("profile_id", userId);
  if (deleteError) throw deleteError;

  if (interests?.length) {
    const { error: insertError } = await client.from("profile_interests").insert(
      interests.map((interest) => ({
        profile_id: userId,
        interest_id: interest.id,
      })),
    );
    if (insertError) throw insertError;
  }

  const { error: profileError } = await client
    .from("profiles")
    .update({ onboarding_completed: true, personality_result: personalityResult ?? {} })
    .eq("id", userId);
  if (profileError) throw profileError;
}
