import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  // Verify the caller is a squad_admin or super_admin
  const authClient = await createServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: caller } = await authClient
    .from("players")
    .select("role, squad_id")
    .eq("id", user.id)
    .single();

  if (!caller || !["squad_admin", "super_admin"].includes(caller.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();
  const { first_name, last_name, email, password, gender, role, squad_id } = body;

  // Squad admin can only add to their own squad
  if (caller.role === "squad_admin" && squad_id !== caller.squad_id) {
    return NextResponse.json({ error: "Cannot add players to another squad." }, { status: 403 });
  }

  // Use service role to create auth user (bypasses email confirmation)
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: newUser, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // skip confirmation email
  });

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 });
  }

  // Insert player row
  const { error: playerError } = await adminClient.from("players").insert({
    id: newUser.user.id,
    squad_id,
    first_name,
    last_name,
    gender,
    role: role ?? "player",
    temp_password_changed: false,
  });

  if (playerError) {
    // Clean up the auth user if player insert fails
    await adminClient.auth.admin.deleteUser(newUser.user.id);
    return NextResponse.json({ error: playerError.message }, { status: 400 });
  }

  return NextResponse.json({ success: true, id: newUser.user.id });
}
