// Direct-from-browser auth against Supabase, used while the site is hosted on
// GitHub Pages (no server available). The publishable key below is designed
// to be public — real enforcement of "is this user active?" happens inside
// Postgres via Row Level Security, not in this file, so it cannot be defeated
// by editing this script in DevTools.
const SUPABASE_URL = 'https://fkwykgjyxeebescxnttf.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_EhCI7fnvd0Z3j-E1pm6KFA_nE1_p_aX';

const SB_HEADERS = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
};

const TOKEN_KEY = 'sid';

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}
function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

// Looks up a username and returns its row if found, regardless of status
// (used only to produce a friendly error message on the login screen —
// the real gate is the RLS check inside createSession()).
async function findUser(username) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/users?username=eq.${encodeURIComponent(username)}&select=username,status`,
    { headers: SB_HEADERS },
  );
  if (!res.ok) return null;
  const rows = await res.json();
  return rows[0] || null;
}

// Creates a session row. Postgres RLS rejects this outright unless the
// username currently exists AND is active — that check cannot be bypassed
// from the browser no matter how this script is modified.
async function createSession(username) {
  const token = crypto.randomUUID() + crypto.randomUUID();
  const res = await fetch(`${SUPABASE_URL}/rest/v1/sessions`, {
    method: 'POST',
    headers: { ...SB_HEADERS, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify({ token, username }),
  });
  if (!res.ok) return null;
  setToken(token);
  return token;
}

// Resolves the current session's user, re-checking live status on every call
// so a disabled/deleted account stops working on the very next page load.
async function getSessionUser() {
  const token = getToken();
  if (!token) return null;

  const sessionRes = await fetch(
    `${SUPABASE_URL}/rest/v1/sessions?token=eq.${encodeURIComponent(token)}&select=username`,
    { headers: SB_HEADERS },
  );
  if (!sessionRes.ok) return null;
  const sessions = await sessionRes.json();
  if (!sessions.length) return null;

  const userRes = await fetch(
    `${SUPABASE_URL}/rest/v1/users?username=eq.${encodeURIComponent(sessions[0].username)}&select=name,username,status,is_admin`,
    { headers: SB_HEADERS },
  );
  if (!userRes.ok) return null;
  const users = await userRes.json();
  if (!users.length || users[0].status !== 'active') return null;
  return users[0];
}

// ── Admin CRUD (add/toggle/delete users) ──
// Writes to `users` are only accepted by Postgres if X-Session-Token belongs
// to a currently-active admin (enforced by RLS policies + current_session_is_admin()).
// Sending a fake or missing token, or editing this file in DevTools, cannot
// bypass that — the check happens inside the database on every request.
function authHeaders() {
  return { ...SB_HEADERS, 'X-Session-Token': getToken() || '' };
}

async function adminListUsers(q) {
  let url = `${SUPABASE_URL}/rest/v1/users?select=id,name,username,status,is_admin,created_at&order=created_at.desc`;
  if (q) {
    const like = encodeURIComponent(`%${q}%`);
    url += `&or=(name.ilike.${like},username.ilike.${like})`;
  }
  const res = await fetch(url, { headers: SB_HEADERS });
  if (!res.ok) return [];
  return res.json();
}

async function adminAddUser({ name, username, is_admin }) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/users`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: JSON.stringify({ name, username, status: 'active', is_admin: Boolean(is_admin) }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = err.code === '23505' ? 'اسم المستخدم مستخدم مسبقًا' : (err.message || 'تعذر إنشاء المستخدم');
    return { ok: false, error: msg };
  }
  const rows = await res.json();
  return { ok: true, data: rows[0] };
}

async function adminUpdateUser(id, patch) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
  return { ok: res.ok };
}

async function adminDeleteUser(id) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return { ok: res.ok };
}

async function deleteSession() {
  const token = getToken();
  clearToken();
  if (!token) return;
  await fetch(`${SUPABASE_URL}/rest/v1/sessions?token=eq.${encodeURIComponent(token)}`, {
    method: 'DELETE',
    headers: SB_HEADERS,
  });
}

// Called at the top of protected pages. Redirects to /login.html if there is
// no valid, currently-active session; otherwise returns the user record.
async function requireSession() {
  const user = await getSessionUser();
  if (!user) {
    clearToken();
    location.href = 'login.html';
    return null;
  }
  return user;
}
