import { authHeaders, clearCookieHeader, getCookieToken, getEnv } from "./utils/session.ts";

export default async (req: Request) => {
  const token = getCookieToken(req);

  if (token) {
    const { supabaseUrl } = getEnv();
    await fetch(`${supabaseUrl}/rest/v1/sessions?token=eq.${encodeURIComponent(token)}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
  }

  return new Response(null, {
    status: 302,
    headers: {
      Location: "/login.html",
      "Set-Cookie": clearCookieHeader(),
    },
  });
};
