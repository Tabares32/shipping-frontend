import { connectRealtime } from './utils/realtime';
import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

import App from "./App";

const root = createRoot(document.getElementById("root"));
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Init realtime connection
connectRealtime(process.env.REACT_APP_API_URL || 'http://localhost:8000');
