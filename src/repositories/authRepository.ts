import { requireSupabase } from "../lib/supabase";

export async function sendSignInCode(email: string) {
  const client = requireSupabase();
  const { error } = await client.auth.signInWithOtp({
    email: email.trim().toLowerCase(),
    options: {
      shouldCreateUser: true,
      emailRedirectTo: `${window.location.origin}/`,
    },
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

export async function signInWithPassword(email: string, password: string) {
  const { data, error } = await requireSupabase().auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error) throw error;
  return data.session;
}

export async function setAccountPassword(password: string) {
  const { data, error } = await requireSupabase().auth.updateUser({ password });
  if (error) throw error;
  return data.user;
}

export async function signOut() {
  const { error } = await requireSupabase().auth.signOut();
  if (error) throw error;
}
