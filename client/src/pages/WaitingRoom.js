import { useQueue } from "../QueueContext";

export default function WaitingRoom() {
  const { queue, currentToken, currentName, consultTime, totalInQueue } = useQueue();

  const ahead = totalInQueue;
  const waitMins = ahead * consultTime;

  return (
    <div className="page">

      {/* ── Big token display ── */}
      <div className="card">
        <div style={{ textAlign: "center", marginBottom: 4 }}>
          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-3)", marginBottom: "1rem" }}>
            Currently being seen
          </div>
        </div>

        <div className="big-token-wrap">
          {currentToken ? (
            <>
              <div className={"big-token" + (currentToken ? " active" : "")}>
                #{currentToken}
              </div>
              <div className="big-token-label">{currentName}</div>
            </>
          ) : (
            <>
              <div className="big-token" style={{ color: "var(--text-3)", letterSpacing: 0 }}>—</div>
              <div className="big-token-label">Clinic hasn't started yet</div>
            </>
          )}
        </div>

        {currentToken && (
          <div style={{ textAlign: "center" }}>
            <span className="badge badge-active">● With doctor now</span>
          </div>
        )}
      </div>

      {/* ── Wait info ── */}
      <div className="wait-grid">
        <div className="metric">
          <div className="metric-label">Tokens ahead</div>
          <div className="metric-value">{ahead}</div>
        </div>
        <div className="metric">
          <div className="metric-label">Est. wait</div>
          <div className="metric-value">{waitMins}</div>
          <div className="metric-sub">minutes</div>
        </div>
        <div className="metric">
          <div className="metric-label">Per patient</div>
          <div className="metric-value">{consultTime}</div>
          <div className="metric-sub">minutes</div>
        </div>
      </div>

      {/* ── Waiting list ── */}
      <div className="card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
          <div className="card-label" style={{ marginBottom: 0 }}>Waiting list</div>
          <span style={{ fontSize: 12, color: "var(--text-3)" }}>Updates live · no refresh needed</span>
        </div>

        {queue.length === 0 ? (
          <div className="empty">No one waiting right now.</div>
        ) : (
          queue.map((p) => (
            <div key={p.token} className="waiting-item">
              <span className="waiting-pos">{p.position}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{p.name}</div>
                <div style={{ fontSize: 12, color: "var(--text-3)" }}>Token #{p.token}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>~{p.estimatedWaitMins} min</div>
                <div style={{ fontSize: 11, color: "var(--text-3)" }}>
                  {p.position === 1 ? "You're next!" : `${p.position - 1} ahead of you`}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
