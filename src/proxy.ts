import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Unauthenticated users can only access /login
  if (!user && pathname !== "/login") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Authenticated users are redirected away from /login
  if (user && pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Force password change on first login
  if (user && pathname !== "/change-password") {
    const { data: player } = await supabase
      .from("players")
      .select("role, temp_password_changed")
      .eq("id", user.id)
      .single();

    if (player && !player.temp_password_changed && player.role !== "super_admin") {
      return NextResponse.redirect(new URL("/change-password", request.url));
    }

    // Role-based path protection
    if (pathname.startsWith("/super-admin") && player?.role !== "super_admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    if (
      pathname.startsWith("/squad-admin") &&
      !["squad_admin", "super_admin"].includes(player?.role ?? "")
    ) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
