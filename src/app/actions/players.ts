"use server";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types";

export async function setPlayerRole(
  playerId: string,
  role: UserRole
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { data: me } = await supabase
    .from("players")
    .select("role")
    .eq("id", user.id)
    .single();

  if (me?.role !== "super_admin") {
    return { success: false, error: "Not authorized" };
  }

  const serviceSupabase = createServiceClient();
  const { error } = await serviceSupabase
    .from("players")
    .update({ role })
    .eq("id", playerId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function resetPlayerPassword(
  playerId: string
): Promise<{ success: boolean; password?: string; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { data: me } = await supabase
    .from("players")
    .select("role")
    .eq("id", user.id)
    .single();

  if (me?.role !== "super_admin") {
    return { success: false, error: "Not authorized" };
  }

  const serviceSupabase = createServiceClient();
  const password = "Test1234!";
  const { error } = await serviceSupabase.auth.admin.updateUserById(playerId, {
    password,
  });

  if (error) return { success: false, error: error.message };
  return { success: true, password };
}
