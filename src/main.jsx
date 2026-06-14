import React from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import { AuthProvider } from "./AuthContext";
import { BoardProvider } from "./BoardContext";
import NoraHRRoadmap from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <BoardProvider>
        <NoraHRRoadmap />
      </BoardProvider>
    </AuthProvider>
  </React.StrictMode>,
);
