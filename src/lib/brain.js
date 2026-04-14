// amber-phone-call is a voice adapter, not a brain. Every turn of
// conversation is forwarded to the real Amber backend, which owns:
//   - Claude reasoning
//   - Perplexity embeddings for relational / contact memory
//   - Perplexity search for deep research
//   - Todoist, Calendar, health, Clay, GitHub tools
//   - Multi-tenant identity and conversation history
//
// This module is intentionally thin. It POSTs the caller's transcript
// and gets back a text reply ready to be spoken.

const DEFAULT_TIMEOUT_MS = 25_000; // Twilio waits up to 30s for TwiML

export async function askAmber({ callSid, caller, userText }) {
  const url = process.env.AMBER_AGENT_URL;
  if (!url) {
    return fallbackReply(userText);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const res = await fetch(`${url.replace(/\/+$/, "")}/api/voice-turn`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.AMBER_AGENT_SECRET
          ? { Authorization: `Bearer ${process.env.AMBER_AGENT_SECRET}` }
          : {}),
      },
      body: JSON.stringify({
        callSid,
        caller,
        userText,
        channel: "phone",
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`amber brain ${res.status}: ${body.slice(0, 200)}`);
    }

    const data = await res.json();
    if (!data.reply || typeof data.reply !== "string") {
      throw new Error("amber brain returned no reply field");
    }
    return data.reply;
  } finally {
    clearTimeout(timer);
  }
}

// Signals call end to the brain so it can flush conversation state,
// embed the transcript, update contact memory, etc.
export async function endSession(callSid) {
  const url = process.env.AMBER_AGENT_URL;
  if (!url || !callSid) return;
  try {
    await fetch(`${url.replace(/\/+$/, "")}/api/voice-turn/end`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.AMBER_AGENT_SECRET
          ? { Authorization: `Bearer ${process.env.AMBER_AGENT_SECRET}` }
          : {}),
      },
      body: JSON.stringify({ callSid }),
    });
  } catch (err) {
    console.warn("[brain] endSession failed:", err.message);
  }
}

// Only used when AMBER_AGENT_URL is unset. Keeps the line from dying
// during local smoke tests before the backend is wired.
function fallbackReply(userText) {
  console.warn("[brain] AMBER_AGENT_URL is not set. Responding with fallback.");
  if (!userText) {
    return "Amber's backend isn't connected yet. I can't think without it.";
  }
  return `I heard you say: ${userText.slice(0, 120)}. But my brain isn't wired up yet, so that's about all I've got.`;
}
