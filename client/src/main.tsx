import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Check for installed PWA
window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent Chrome 67 and earlier from automatically showing the prompt
  e.preventDefault();
  // Stash the event so it can be triggered later
  // This could be exposed via context if we want to add a custom install button
  (window as any).deferredPrompt = e;
});

createRoot(document.getElementById("root")!).render(<App />);
