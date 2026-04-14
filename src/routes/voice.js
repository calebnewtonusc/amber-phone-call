import express from "express";
import twilio from "twilio";

const { twiml: Twiml, validateRequest } = twilio;

export const voiceRouter = express.Router();

function verifyTwilio(req, res, next) {
  if (process.env.SKIP_TWILIO_SIGNATURE === "true") return next();

  const signature = req.header("X-Twilio-Signature");
  const url = `${process.env.PUBLIC_URL}${req.originalUrl}`;
  const valid = validateRequest(
    process.env.TWILIO_AUTH_TOKEN,
    signature,
    url,
    req.body,
  );
  if (!valid) {
    console.warn("[voice] rejected: invalid Twilio signature", { url });
    return res.status(403).send("Forbidden");
  }
  return next();
}

// Twilio hits this when a call comes in. We return TwiML that
// opens a bidirectional stream to ElevenLabs Conversational AI.
voiceRouter.post("/incoming", verifyTwilio, (req, res) => {
  const { From, To, CallSid } = req.body;
  console.log("[voice] incoming call", { From, To, CallSid });

  const agentId = process.env.ELEVENLABS_AGENT_ID;
  if (!agentId) {
    const voice = new Twiml.VoiceResponse();
    voice.say(
      "Amber is not configured yet. Please set the ElevenLabs agent ID. Goodbye.",
    );
    voice.hangup();
    return res.type("text/xml").send(voice.toString());
  }

  const voice = new Twiml.VoiceResponse();
  const connect = voice.connect();
  const stream = connect.stream({
    url: `wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${agentId}`,
  });
  // Pass caller identity through so the agent can personalize.
  stream.parameter({ name: "caller", value: From || "unknown" });
  stream.parameter({ name: "twilio_call_sid", value: CallSid || "" });

  res.type("text/xml").send(voice.toString());
});

// Twilio status callback. Log lifecycle events for observability.
voiceRouter.post("/status", verifyTwilio, (req, res) => {
  const { CallSid, CallStatus, From, To, CallDuration } = req.body;
  console.log("[voice] status", {
    CallSid,
    CallStatus,
    From,
    To,
    CallDuration,
  });
  res.sendStatus(204);
});
