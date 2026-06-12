import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";

const SERVER_URL = process.env.REACT_APP_SERVER_URL || "http://localhost:4000";

// Create one socket instance shared across the app
const socket = io(SERVER_URL, { autoConnect: true });

const QueueContext = createContext(null);

export function QueueProvider({ children }) {
  const [queueState, setQueueState] = useState({
    queue: [],
    currentToken: null,
    currentName: null,
    consultTime: 8,
    totalInQueue: 0,
  });
  const [connected, setConnected] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    // ── Listen for live state updates from server ──────────────────────────
    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    socket.on("queue_update", (data) => {
      setQueueState(data);
    });

    socket.on("error_msg", ({ message }) => {
      showToast(message, "error");
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("queue_update");
      socket.off("error_msg");
    };
  }, []);

  function showToast(message, type = "info") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  }

  // ── Actions emitted to server ──────────────────────────────────────────────
  function addPatient(name) {
    if (!name.trim()) return;
    socket.emit("add_patient", { name });
    showToast(`Token added for ${name.trim()}`);
  }

  function callNext() {
    socket.emit("call_next");
  }

  function removePatient(token) {
    socket.emit("remove_patient", { token });
  }

  function setConsultTime(minutes) {
    socket.emit("set_consult_time", { minutes });
  }

  return (
    <QueueContext.Provider
      value={{
        ...queueState,
        connected,
        toast,
        addPatient,
        callNext,
        removePatient,
        setConsultTime,
      }}
    >
      {children}
    </QueueContext.Provider>
  );
}

export function useQueue() {
  return useContext(QueueContext);
}
