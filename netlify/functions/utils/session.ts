export function getEnv() {
  const supabaseUrl = process.env.SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return { supabaseUrl, serviceKey };
}

export function authHeaders() {
  const { serviceKey } = getEnv();
  return { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` };
}

export function getCookieToken(req: Request): string | null {
  const cookie = req.headers.get("cookie") || "";
  const match = cookie.match(/(?:^|;\s*)sid=([^;]+)/);
  return match?.[1] ?? null;
}

export type SessionUser = {
  name: string;
  username: string;
  status: string;
  is_admin: boolean;
};

export async function getSessionUser(req: Request): Promise<SessionUser | null> {
  const token = getCookieToken(req);
  if (!token) return null;

  const { supabaseUrl } = getEnv();
  const headers = authHeaders();

  const sessionRes = await fetch(
    `${supabaseUrl}/rest/v1/sessions?token=eq.${encodeURIComponent(token)}&select=username`,
    { headers },
  );
  if (!sessionRes.ok) return null;
  const sessions = await sessionRes.json();
  if (!sessions.length) return null;

  const userRes = await fetch(
    `${supabaseUrl}/rest/v1/users?username=eq.${encodeURIComponent(sessions[0].username)}&select=name,username,status,is_admin`,
    { headers },
  );
  if (!userRes.ok) return null;
  const users = await userRes.json();
  if (!users.length || users[0].status !== "active") return null;
  return users[0];
}

export function clearCookieHeader(): string {
  return "sid=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0";
}
