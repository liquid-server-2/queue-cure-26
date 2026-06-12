# Queue Cure '26 🏥

> Live clinic queue management — built for Queue Cure '26 hackathon on Wooble.

76% of India's 1.5 million clinics run on paper tokens. Patients wait 2–3 hours with zero visibility. Queue Cure fixes that with a real-time queue system so patients know exactly when they'll be called.

---

## What it does

**Receptionist screen** — Add patients, call next token, set avg consultation time, remove patients who left.

**Waiting room screen** — Shows current token being seen, how many are ahead, and estimated wait time — all computed from real data, not hardcoded.

**Live sync** — Both screens update the moment "Call next" is clicked. No refresh. No polling. Pure WebSocket.

---

## Tech stack

| Layer | Technology |
|---|---|
| Backend | Node.js + Express + Socket.io |
| Frontend | React + React Router |
| Real-time | WebSockets via Socket.io |

---

## Setup & run

### 1. Install dependencies

```bash
# In the server folder
cd server
npm install

# In the client folder
cd ../client
npm install
```

### 2. Start the server

```bash
cd server
npm run dev
# Server runs on http://localhost:4000
```

### 3. Start the client (new terminal)

```bash
cd client
npm start
# App opens at http://localhost:3000
```

### 4. Open two tabs
- `http://localhost:3000/` → Receptionist view
- `http://localhost:3000/waiting` → Patient waiting room

Add a patient in tab 1, click "Call next" — watch tab 2 update instantly.

---

## Socket event diagram

```
┌─────────────────┐         ┌──────────────┐         ┌──────────────────┐
│   Receptionist  │         │    Server    │         │  Waiting Room    │
│    (Client A)   │         │  (Node.js)   │         │   (Client B)     │
└────────┬────────┘         └──────┬───────┘         └────────┬─────────┘
         │                         │                           │
         │── add_patient ─────────>│                           │
         │                         │── queue_update ─────────>│
         │<── queue_update ────────│                           │
         │                         │                           │
         │── call_next ───────────>│                           │
         │                         │── queue_update ─────────>│
         │<── queue_update ────────│                           │
         │                         │                           │
         │── remove_patient ──────>│                           │
         │                         │── queue_update ─────────>│
         │<── queue_update ────────│                           │
         │                         │                           │
         │── set_consult_time ────>│                           │
         │                         │── queue_update ─────────>│
         │<── queue_update ────────│                           │
```

**Events emitted by client:**
- `add_patient` `{ name: string }` — Add a new patient to queue
- `call_next` — Call the next patient (doctor is ready)
- `remove_patient` `{ token: number }` — Remove patient who left
- `set_consult_time` `{ minutes: number }` — Update avg consultation time

**Events emitted by server:**
- `queue_update` — Full state broadcast to ALL connected clients
- `error_msg` `{ message: string }` — Validation error back to sender only

---

## Wait time formula

```
estimatedWait = position × avgConsultationTime
```

- `position` = patient's place in queue (1-indexed, computed live)
- `avgConsultationTime` = set by receptionist, defaults to 8 min
- Recomputed on every state change — never hardcoded

---

## Concurrency & edge cases

**Double-click race condition** — `call_next` uses a server-side `calling` boolean lock + 500ms timeout. If two clicks arrive simultaneously, the second is rejected with an error.

**New client sync** — On every `connect` event, the server immediately emits the full current state to the new socket. No stale view on join.

**Empty queue** — Attempting `call_next` on empty queue returns `error_msg`. Button is also disabled on the frontend.

**Patient leaves** — `remove_patient` lets receptionist delete a token. Queue positions and wait times recompute instantly for all remaining patients.

**Input validation** — All socket inputs validated server-side (name required, consultation time 1–60 min). Frontend validation is a convenience layer only — server is the source of truth.

---

## Project structure

```
queue-cure/
├── server/
│   ├── index.js          # Express + Socket.io server, all queue logic
│   └── package.json
├── client/
│   ├── src/
│   │   ├── index.js              # App entry, router, layout
│   │   ├── index.css             # All styles
│   │   ├── QueueContext.js       # Socket connection + shared state
│   │   └── pages/
│   │       ├── Receptionist.js   # Screen 1
│   │       └── WaitingRoom.js    # Screen 2
│   ├── public/index.html
│   └── package.json
└── README.md
```
