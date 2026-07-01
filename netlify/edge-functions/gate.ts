// Runs on every request before any static file is served.
// Blocks access to the whole site unless a valid, active session cookie is present.
import type { Context } from "https://edge.netlify.com";

const PUBLIC_PATHS = new Set(["/login.html", "/.netlify/functions/login"]);

export default async (request: Request, context: Context) => {
  const url = new URL(request.url);

  if (PUBLIC_PATHS.has(url.pathname)) {
    return context.next();
  }

  const token = getCookie(request, "sid");
  if (!token || !(await isSessionActive(token))) {
    return Response.redirect(new URL("/login.html", request.url), 302);
  }

  return context.next();
};

function getCookie(request: Request, name: string): string | null {
  const cookie = request.headers.get("cookie") || "";
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match?.[1] ?? null;
}

async function isSessionActive(token: string): Promise<boolean> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) return false;

  const headers = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` };

  const sessionRes = await fetch(
    `${supabaseUrl}/rest/v1/sessions?token=eq.${encodeURIComponent(token)}&select=username`,
    { headers },
  );
  if (!sessionRes.ok) return false;
  const sessions = await sessionRes.json();
  if (!sessions.length) return false;

  const userRes = await fetch(
    `${supabaseUrl}/rest/v1/users?username=eq.${encodeURIComponent(sessions[0].username)}&select=status`,
    { headers },
  );
  if (!userRes.ok) return false;
  const users = await userRes.json();
  return users.length > 0 && users[0].status === "active";
}
