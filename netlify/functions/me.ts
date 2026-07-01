import { getSessionUser } from "./utils/session.ts";

export default async (req: Request) => {
  const user = await getSessionUser(req);
  if (!user) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({ name: user.name, username: user.username, is_admin: user.is_admin }),
    { headers: { "Content-Type": "application/json" } },
  );
};
