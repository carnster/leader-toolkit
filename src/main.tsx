import { createRoot } from "react-dom/client";
import { ThemeProvider } from "next-themes";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
    <App />
  </ThemeProvider>
);

// Dismiss the splash screen (rendered inline in index.html so it paints
// before the bundle loads). Keep it up long enough for the brand animation
// to complete, then fade and remove.
const splash = document.getElementById("splash");
if (splash) {
  const MIN_DISPLAY_MS = 1900;
  const shownAt = performance.now();
  const dismiss = () => {
    const remaining = Math.max(0, MIN_DISPLAY_MS - (performance.now() - shownAt));
    setTimeout(() => {
      splash.classList.add("splash-hide");
      setTimeout(() => splash.remove(), 600);
    }, remaining);
  };
  if (document.readyState === "complete") {
    dismiss();
  } else {
    window.addEventListener("load", dismiss, { once: true });
  }
}

// Register the minimal service worker (PWA installability; no caching)
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}
