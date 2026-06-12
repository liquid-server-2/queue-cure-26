const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// ─── In-memory queue state ────────────────────────────────────────────────────
let state = {
  queue: [],           // Array of { token, name, addedAt }
  currentToken: null,  // Token number currently being seen
  currentName: null,   // Name of current patient
  nextTokenNum: 1,     // Auto-incrementing token counter
  consultTime: 8,      // Avg consultation time in minutes
  calling: false,      // Debounce lock — prevents double-call race condition
};

// Helper: compute estimated wait for each patient in queue
function enrichQueue(queue, consultTime) {
  return queue.map((p, i) => ({
    ...p,
    position: i + 1,
    estimatedWaitMins: (i + 1) * consultTime,
  }));
}

// Broadcast full state to all connected clients
function broadcast() {
  io.emit("queue_update", {
    queue: enrichQueue(state.queue, state.consultTime),
    currentToken: state.currentToken,
    currentName: state.currentName,
    consultTime: state.consultTime,
    totalInQueue: state.queue.length,
  });
}

// ─── REST endpoints (optional — sockets handle live updates) ─────────────────
app.get("/state", (req, res) => {
  res.json({
    queue: enrichQueue(state.queue, state.consultTime),
    currentToken: state.currentToken,
    currentName: state.currentName,
    consultTime: state.consultTime,
    totalInQueue: state.queue.length,
  });
});

// ─── Socket events ────────────────────────────────────────────────────────────
io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Send current state immediately on connect so new clients are in sync
  socket.emit("queue_update", {
    queue: enrichQueue(state.queue, state.consultTime),
    currentToken: state.currentToken,
    currentName: state.currentName,
    consultTime: state.consultTime,
    totalInQueue: state.queue.length,
  });

  // ── add_patient ─────────────────────────────────────────────────────────────
  // Receptionist adds a new patient to the queue
  socket.on("add_patient", ({ name }) => {
    if (!name || typeof name !== "string" || !name.trim()) {
      socket.emit("error_msg", { message: "Patient name is required." });
      return;
    }
    const patient = {
      token: state.nextTokenNum++,
      name: name.trim(),
      addedAt: Date.now(),
    };
    state.queue.push(patient);
    console.log(`Added: Token #${patient.token} — ${patient.name}`);
    broadcast();
  });

  // ── call_next ───────────────────────────────────────────────────────────────
  // Receptionist calls the next patient
  // Debounced with `calling` flag to prevent race condition on double-click
  socket.on("call_next", () => {
    if (state.calling) {
      socket.emit("error_msg", { message: "Already calling next patient." });
      return;
    }
    if (state.queue.length === 0) {
      socket.emit("error_msg", { message: "Queue is empty." });
      return;
    }

    state.calling = true;
    const next = state.queue.shift();
    state.currentToken = next.token;
    state.currentName = next.name;

    console.log(`Now serving: Token #${next.token} — ${next.name}`);
    broadcast();

    // Release lock after short delay
    setTimeout(() => { state.calling = false; }, 500);
  });

  // ── remove_patient ──────────────────────────────────────────────────────────
  // Receptionist removes a patient from queue (e.g. patient left)
  socket.on("remove_patient", ({ token }) => {
    const before = state.queue.length;
    state.queue = state.queue.filter((p) => p.token !== token);
    if (state.queue.length < before) {
      console.log(`Removed Token #${token} from queue`);
      broadcast();
    }
  });

  // ── set_consult_time ────────────────────────────────────────────────────────
  // Receptionist updates average consultation time
  socket.on("set_consult_time", ({ minutes }) => {
    const mins = parseInt(minutes, 10);
    if (isNaN(mins) || mins < 1 || mins > 60) {
      socket.emit("error_msg", { message: "Consultation time must be 1–60 minutes." });
      return;
    }
    state.consultTime = mins;
    console.log(`Consult time updated: ${mins} min`);
    broadcast();
  });

  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// ─── Start server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Queue Cure server running on http://localhost:${PORT}`);
});
