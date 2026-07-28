import { getStoredState } from "../lib/storage";

// Content script for Focus Extension
(async () => {
  const state = await getStoredState();
  if (state.deepFocusMode && state.isActive) {
    // Render a non-intrusive focus status indicator pill on active page if deep focus is enabled
    if (document.getElementById("focus-ext-floating-pill")) return;

    const pill = document.createElement("div");
    pill.id = "focus-ext-floating-pill";
    pill.style.position = "fixed";
    pill.style.bottom = "16px";
    pill.style.right = "16px";
    pill.style.zIndex = "999999";
    pill.style.padding = "6px 12px";
    pill.style.borderRadius = "20px";
    pill.style.background = "rgba(15, 23, 42, 0.85)";
    pill.style.backdropFilter = "blur(12px)";
    pill.style.border = "1px solid rgba(99, 102, 241, 0.3)";
    pill.style.color = "#e2e8f0";
    pill.style.fontFamily = "system-ui, -apple-system, sans-serif";
    pill.style.fontSize = "12px";
    pill.style.fontWeight = "600";
    pill.style.boxShadow = "0 8px 32px rgba(0, 0, 0, 0.4)";
    pill.style.display = "flex";
    pill.style.alignItems = "center";
    pill.style.gap = "6px";
    pill.style.pointerEvents = "auto";
    pill.style.transition = "all 0.3s ease";

    pill.innerHTML = `
      <span style="width: 8px; height: 8px; border-radius: 50%; background-color: #10b981; display: inline-block; animate: pulse 2s infinite;"></span>
      <span>Focus Mode Active</span>
    `;

    document.body.appendChild(pill);
  }
})();
