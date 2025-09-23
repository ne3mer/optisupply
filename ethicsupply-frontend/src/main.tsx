import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {/* Skip link for keyboard users */}
    <a href="#main-content" className="skip-link">Skip to content</a>
    <App />
  </React.StrictMode>
);
