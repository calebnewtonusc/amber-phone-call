import express from "express";
import { amberClient } from "../lib/amber.js";

export const toolsRouter = express.Router();

// ElevenLabs Conversational AI calls these webhooks mid-conversation
// to let Amber reach into her actual brain (contacts, health, todos).
// Configure each as a server tool in the ElevenLabs agent settings.

function verifyToolSecret(req, res, next) {
  const expected = process.env.TOOL_WEBHOOK_SECRET;
  if (!expected) return next();
  const auth = req.header("Authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (token !== expected) {
    return res.status(401).json({ error: "unauthorized" });
  }
  return next();
}

toolsRouter.use(verifyToolSecret);

// Look up a contact by name or phone. Returns the relationship context
// Amber has on that person (last conversation, health notes, etc).
toolsRouter.post("/lookup-contact", async (req, res, next) => {
  try {
    const { query } = req.body;
    const data = await amberClient.lookupContact(query);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// Return Caleb's current Todoist tasks for today so Amber can answer
// "what's on my plate today" over the phone.
toolsRouter.post("/todays-tasks", async (_req, res, next) => {
  try {
    const data = await amberClient.todaysTasks();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// Fetch the latest health snapshot (sleep, workout, mood) Amber is tracking.
toolsRouter.post("/health-snapshot", async (_req, res, next) => {
  try {
    const data = await amberClient.healthSnapshot();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// Log a memo captured during the call. Amber can say "got it, I'll
// remember that" and this persists it alongside the conversation log.
toolsRouter.post("/remember", async (req, res, next) => {
  try {
    const { note, tags } = req.body;
    const data = await amberClient.remember({ note, tags });
    res.json(data);
  } catch (err) {
    next(err);
  }
});
