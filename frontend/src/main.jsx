import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import { App } from "./App.jsx";
import { AdminPage } from "./pages/admin/AdminPage.jsx";

const isAdmin = window.location.pathname === "/admin";

createRoot(document.getElementById("app")).render(
  <StrictMode>
    {isAdmin ? <AdminPage /> : <App />}
  </StrictMode>
);
