import { authHeaders, getEnv, getSessionUser } from "./utils/session.ts";

export default async (req: Request) => {
  const caller = await getSessionUser(req);
  if (!caller || !caller.is_admin) {
    return json({ error: "غير مصرح لك بهذا الإجراء" }, 403);
  }

  const { supabaseUrl } = getEnv();
  const headers = { ...authHeaders(), "Content-Type": "application/json" };
  const url = new URL(req.url);

  if (req.method === "GET") {
    const q = url.searchParams.get("q")?.trim();
    let query = `${supabaseUrl}/rest/v1/users?select=id,name,username,status,is_admin,created_at&order=created_at.desc`;
    if (q) {
      const like = encodeURIComponent(`%${q}%`);
      query += `&or=(name.ilike.${like},username.ilike.${like})`;
    }
    const res = await fetch(query, { headers });
    const data = await res.json();
    return json(data, 200);
  }

  if (req.method === "POST") {
    const body = await req.json().catch(() => ({}));
    const name = String(body.name || "").trim();
    const username = String(body.username || "").trim();
    if (!name || !username) {
      return json({ error: "الاسم واسم المستخدم مطلوبان" }, 400);
    }

    const res = await fetch(`${supabaseUrl}/rest/v1/users`, {
      method: "POST",
      headers: { ...headers, Prefer: "return=representation" },
      body: JSON.stringify({
        name,
        username,
        status: "active",
        is_admin: Boolean(body.is_admin),
      }),
    });

    if (!res.ok) {
      return json({ error: "تعذر إنشاء المستخدم، قد يكون اسم المستخدم مستخدمًا مسبقًا" }, 409);
    }
    const created = await res.json();
    return json(created[0], 201);
  }

  if (req.method === "PATCH") {
    const id = url.searchParams.get("id");
    if (!id) return json({ error: "id مطلوب" }, 400);

    const body = await req.json().catch(() => ({}));
    const patch: Record<string, unknown> = {};
    if (body.status === "active" || body.status === "inactive") patch.status = body.status;
    if (typeof body.is_admin === "boolean") patch.is_admin = body.is_admin;
    if (typeof body.name === "string" && body.name.trim()) patch.name = body.name.trim();

    if (Object.keys(patch).length === 0) {
      return json({ error: "لا يوجد ما يتم تحديثه" }, 400);
    }

    const res = await fetch(`${supabaseUrl}/rest/v1/users?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(patch),
    });
    if (!res.ok) return json({ error: "تعذر التحديث" }, 400);
    return json({ ok: true }, 200);
  }

  if (req.method === "DELETE") {
    const id = url.searchParams.get("id");
    if (!id) return json({ error: "id مطلوب" }, 400);

    const res = await fetch(`${supabaseUrl}/rest/v1/users?id=eq.${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers,
    });
    if (!res.ok) return json({ error: "تعذر الحذف" }, 400);
    return json({ ok: true }, 200);
  }

  return new Response("Method Not Allowed", { status: 405 });
};

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
