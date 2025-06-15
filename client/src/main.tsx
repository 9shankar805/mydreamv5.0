import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

try {
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error("Root element not found");
  }
  
  // Add a temporary loading indicator
  rootElement.innerHTML = '<div style="padding: 20px; text-align: center;">Loading Siraha Bazaar...</div>';
  
  const root = createRoot(rootElement);
  root.render(<App />);
  
  console.log("React app mounted successfully");
} catch (error: any) {
  console.error("Failed to mount React app:", error);
  const errorMessage = error?.message || String(error);
  document.body.innerHTML = `<div style="padding: 20px; color: red; text-align: center;">Error mounting React app: ${errorMessage}</div>`;
}
