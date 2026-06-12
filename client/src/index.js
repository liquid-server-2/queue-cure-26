import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import { QueueProvider, useQueue } from "./QueueContext";
import Receptionist from "./pages/Receptionist";
import WaitingRoom from "./pages/WaitingRoom";
import "./index.css";

function TopBar() {
  const { connected } = useQueue();
  return (
    <header className="topbar">
      <div className="topbar-brand">
        <div className="topbar-logo">QC</div>
        <span className="topbar-title">Queue Cure</span>
      </div>
      <nav className="topbar-nav">
        <NavLink
          to="/"
          end
          className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}
        >
          <span>Receptionist</span>
        </NavLink>
        <NavLink
          to="/waiting"
          className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}
        >
          <span>Waiting room</span>
        </NavLink>
      </nav>
      <div className="connection-dot">
        <div className={"dot" + (connected ? " connected" : "")} />
        {connected ? "Live" : "Connecting…"}
      </div>
    </header>
  );
}

function Toast() {
  const { toast } = useQueue();
  if (!toast) return null;
  return (
    <div className="toast-wrap">
      <div className={"toast " + toast.type}>{toast.message}</div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <QueueProvider>
        <div className="app-shell">
          <TopBar />
          <main>
            <Routes>
              <Route path="/" element={<Receptionist />} />
              <Route path="/waiting" element={<WaitingRoom />} />
            </Routes>
          </main>
          <Toast />
        </div>
      </QueueProvider>
    </BrowserRouter>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
