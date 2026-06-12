import { useState } from "react";
import { useQueue } from "../QueueContext";

export default function Receptionist() {
  const {
    queue,
    currentToken,
    currentName,
    consultTime,
    totalInQueue,
    addPatient,
    callNext,
    removePatient,
    setConsultTime,
  } = useQueue();

  const [nameInput, setNameInput] = useState("");

  function handleAdd() {
    if (!nameInput.trim()) return;
    addPatient(nameInput);
    setNameInput("");
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") handleAdd();
  }

  return (
    <div className="page">

      {/* ── Metrics ── */}
      <div className="metrics">
        <div className="metric">
          <div className="metric-label">Now serving</div>
          <div className="metric-value">{currentToken ? `#${currentToken}` : "—"}</div>
          <div className="metric-sub">{currentName || "No active patient"}</div>
        </div>
        <div className="metric">
          <div className="metric-label">In queue</div>
          <div className="metric-value">{totalInQueue}</div>
          <div className="metric-sub">~{totalInQueue * consultTime} min total wait</div>
        </div>
      </div>

      {/* ── Add patient ── */}
      <div className="card">
        <div className="card-label">Add patient</div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="patient-name">Patient name</label>
            <input
              id="patient-name"
              type="text"
              placeholder="e.g. Ananya Sharma"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={handleKeyDown}
              autoComplete="off"
            />
          </div>
          <button
            className="btn btn-primary"
            onClick={handleAdd}
            disabled={!nameInput.trim()}
            style={{ height: 38, marginTop: 23 }}
          >
            + Add
          </button>
        </div>
      </div>

      {/* ── Live queue ── */}
      <div className="card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
          <div className="card-label" style={{ marginBottom: 0 }}>Live queue</div>
          {totalInQueue > 0 && (
            <span className="badge badge-waiting">
              {totalInQueue} waiting
            </span>
          )}
        </div>

        <button
          className="btn-call"
          onClick={callNext}
          disabled={totalInQueue === 0}
        >
          ▶ Call next patient
        </button>

        <div className="queue-list">
          {queue.length === 0 ? (
            <div className="empty">No patients in queue.<br />Add a patient above to begin.</div>
          ) : (
            queue.map((p) => (
              <div key={p.token} className="queue-item">
                <span className="token-num">#{p.token}</span>
                <div className="patient-info">
                  <div className="patient-name">{p.name}</div>
                  <div className="patient-wait">~{p.estimatedWaitMins} min wait · position {p.position}</div>
                </div>
                <button
                  className="btn btn-danger"
                  onClick={() => removePatient(p.token)}
                  title="Remove patient"
                >
                  Remove
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Settings ── */}
      <div className="card">
        <div className="card-label">Settings</div>
        <div className="settings-row">
          <div>
            <div className="settings-label">Avg. consultation time</div>
            <div className="settings-sub">Used to compute all wait estimates</div>
          </div>
          <div className="counter">
            <button
              className="counter-btn"
              onClick={() => setConsultTime(Math.max(1, consultTime - 1))}
              aria-label="Decrease"
            >−</button>
            <span className="counter-val">{consultTime}</span>
            <button
              className="counter-btn"
              onClick={() => setConsultTime(Math.min(60, consultTime + 1))}
              aria-label="Increase"
            >+</button>
            <span style={{ fontSize: 13, color: "var(--text-3)" }}>min</span>
          </div>
        </div>
      </div>

    </div>
  );
}
