import { authHeaders, getEnv } from "./utils/session.ts";

export default async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  let username = "";
  try {
    const body = await req.json();
    username = String(body.username || "").trim();
  } catch {
    return json({ error: "طلب غير صالح" }, 400);
  }

  if (!username) {
    return json({ error: "اسم المستخدم مطلوب" }, 400);
  }

  const { supabaseUrl } = getEnv();
  const headers = authHeaders();

  const userRes = await fetch(
    `${supabaseUrl}/rest/v1/users?username=eq.${encodeURIComponent(username)}&select=username,status`,
    { headers },
  );
  const users = await userRes.json();

  if (!users.length || users[0].status !== "active") {
    return json({ error: "اسم المستخدم غير صحيح أو غير مفعّل" }, 401);
  }

  const token = crypto.randomUUID() + crypto.randomUUID();

  const sessionRes = await fetch(`${supabaseUrl}/rest/v1/sessions`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify({ token, username: users[0].username }),
  });

  if (!sessionRes.ok) {
    return json({ error: "تعذر إنشاء الجلسة" }, 500);
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": `sid=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=5184000`,
    },
  });
};

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
