import { requireSupabase } from "../lib/supabase";

export async function sendSignInCode(email: string) {
  const client = requireSupabase();
  const { error } = await client.auth.signInWithOtp({
    email: email.trim().toLowerCase(),
    options: { shouldCreateUser: true },
  });

  if (error) throw error;
}

export async function verifySignInCode(email: string, token: string) {
  const client = requireSupabase();
  const { data, error } = await client.auth.verifyOtp({
    email: email.trim().toLowerCase(),
    token: token.trim(),
    type: "email",
  });

  if (error) throw error;
  return data.session;
}

export async function signOut() {
  const { error } = await requireSupabase().auth.signOut();
  if (error) throw error;
}
