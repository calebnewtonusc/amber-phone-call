# amber-phone-call

Voice gateway for Amber. A Twilio phone number accepts incoming calls, this server hands the audio stream to ElevenLabs Conversational AI, and the agent calls back into Amber's brain for tools like contact lookup, Todoist, and health snapshots.

## How it works

```
caller dials Twilio number
        │
        ▼
  Twilio webhook
        │  (POST /voice/incoming)
        ▼
amber-phone-call returns TwiML
with <Connect><Stream> to
wss://api.elevenlabs.io/v1/convai/conversation
        │
        ▼
ElevenLabs Conversational AI
(STT + LLM + TTS, single pipeline)
        │
        ▼ (server tools)
POST /tools/lookup-contact
POST /tools/todays-tasks
POST /tools/health-snapshot
POST /tools/remember
        │
        ▼
amber-agent brain
```

## Setup

1. Clone and install

```
npm install
cp .env.example .env
```

2. Fill in `.env` with Twilio creds, ElevenLabs API key and agent ID, and the URL of your running `amber-agent` backend.

3. Create an ElevenLabs Conversational AI agent at https://elevenlabs.io/app/conversational-ai. Give it Amber's system prompt, pick a voice (Rachel is the default), and register the four server tools under Tools:
   - `lookup_contact` -> `POST {PUBLIC_URL}/tools/lookup-contact`
   - `todays_tasks` -> `POST {PUBLIC_URL}/tools/todays-tasks`
   - `health_snapshot` -> `POST {PUBLIC_URL}/tools/health-snapshot`
   - `remember` -> `POST {PUBLIC_URL}/tools/remember`

   Add `Authorization: Bearer <TOOL_WEBHOOK_SECRET>` on each.

4. Deploy to Railway (or anywhere that gives you HTTPS). Set env vars in the dashboard.

5. In the Twilio console, under Phone Numbers -> your number -> Voice Configuration:
   - A call comes in: `Webhook` -> `https://YOUR-DOMAIN/voice/incoming` (HTTP POST)
   - Call status changes: `https://YOUR-DOMAIN/voice/status` (HTTP POST)

6. Call the Twilio number. Amber picks up.

## Local dev

```
npm run dev
```

Expose port 3000 with ngrok and set `PUBLIC_URL` + Twilio webhook to the ngrok URL. Set `SKIP_TWILIO_SIGNATURE=true` while testing.

## Routes

| Route                    | Method | Purpose                                                     |
| ------------------------ | ------ | ----------------------------------------------------------- |
| `/`                      | GET    | Health info                                                 |
| `/health`                | GET    | Liveness check for Railway                                  |
| `/voice/incoming`        | POST   | Twilio voice webhook, returns TwiML to stream to ElevenLabs |
| `/voice/status`          | POST   | Twilio call status callback                                 |
| `/tools/lookup-contact`  | POST   | ElevenLabs tool: fetch contact context from Amber           |
| `/tools/todays-tasks`    | POST   | ElevenLabs tool: Todoist tasks for today                    |
| `/tools/health-snapshot` | POST   | ElevenLabs tool: latest health data                         |
| `/tools/remember`        | POST   | ElevenLabs tool: persist a memo from the call               |

## Environment

See `.env.example` for the full list. Required at minimum: `TWILIO_AUTH_TOKEN`, `ELEVENLABS_AGENT_ID`, `PUBLIC_URL`.

All glory to God! ✝️❤️
