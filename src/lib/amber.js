// Thin HTTP client for the amber-agent brain. When AMBER_AGENT_URL
// is not set, every method returns a safe placeholder so the voice
// flow can still run end-to-end in development.

const BASE = process.env.AMBER_AGENT_URL;
const SECRET = process.env.AMBER_AGENT_SECRET;

async function callAmber(path, body) {
  if (!BASE) {
    return { stub: true, path, body, note: "AMBER_AGENT_URL not configured" };
  }
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(SECRET ? { Authorization: `Bearer ${SECRET}` } : {}),
    },
    body: JSON.stringify(body ?? {}),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`amber ${path} failed: ${res.status} ${text}`);
  }
  return res.json();
}

export const amberClient = {
  lookupContact: (query) => callAmber("/api/tools/lookup-contact", { query }),
  todaysTasks: () => callAmber("/api/tools/todays-tasks", {}),
  healthSnapshot: () => callAmber("/api/tools/health-snapshot", {}),
  remember: ({ note, tags }) =>
    callAmber("/api/tools/remember", { note, tags }),
};
