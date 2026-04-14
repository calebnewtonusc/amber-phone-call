// Helpers for managing the ElevenLabs Conversational AI agent
// programmatically. Only needed for scripted provisioning; the
// call-time path uses the WebSocket URL directly in TwiML.

const BASE = "https://api.elevenlabs.io/v1";

function headers() {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) throw new Error("ELEVENLABS_API_KEY is not set");
  return { "xi-api-key": key, "Content-Type": "application/json" };
}

export async function getAgent(agentId) {
  const res = await fetch(`${BASE}/convai/agents/${agentId}`, {
    headers: headers(),
  });
  if (!res.ok) throw new Error(`getAgent failed: ${res.status}`);
  return res.json();
}

export async function updateAgentPrompt(agentId, systemPrompt) {
  const res = await fetch(`${BASE}/convai/agents/${agentId}`, {
    method: "PATCH",
    headers: headers(),
    body: JSON.stringify({
      conversation_config: {
        agent: { prompt: { prompt: systemPrompt } },
      },
    }),
  });
  if (!res.ok) throw new Error(`updateAgentPrompt failed: ${res.status}`);
  return res.json();
}
