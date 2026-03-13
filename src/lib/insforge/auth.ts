import { createClient } from "@/lib/supabase/client";

export const signOut = async () => {
  const supabase = createClient();
  await supabase.auth.signOut();
  window.location.href = "/login";
};

export const getSession = async () => {
  const supabase = createClient();
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) {
    console.error("Error fetching session:", error);
    return null;
  }
  return session;
};

export const getUserRole = async (userId: string) => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("Error fetching user role:", error);
    return null;
  }
  return data?.role || 'student';
};
