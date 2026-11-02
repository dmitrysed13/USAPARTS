import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/manrope/cyrillic-400.css";
import "@fontsource/manrope/cyrillic-600.css";
import "@fontsource/manrope/latin-400.css";
import "@fontsource/manrope/latin-600.css";
import "@fontsource/oswald/cyrillic-500.css";
import "@fontsource/oswald/cyrillic-600.css";
import "@fontsource/oswald/latin-500.css";
import "@fontsource/oswald/latin-600.css";
import App from "./App.tsx";
import { installAnalytics } from "./lib/analytics.ts";
import { PathProvider } from "./router.tsx";
import "./index.css";

const root = document.getElementById("root");
if (!root) throw new Error("Root element is missing");

installAnalytics();

createRoot(root).render(
  <StrictMode>
    <PathProvider>
      <App />
    </PathProvider>
  </StrictMode>,
);
