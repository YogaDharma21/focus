import { getStoredState, subscribeToStateChanges } from "../lib/storage";

function renderPill(isActive: boolean, timerState: string) {
  const existing = document.getElementById("focus-ext-floating-pill");
  const shouldShow = isActive && (timerState === "WORK" || timerState === "FLOW");

  if (shouldShow) {
    if (!existing) {
      const pill = document.createElement("div");
      pill.id = "focus-ext-floating-pill";
      pill.style.position = "fixed";
      pill.style.bottom = "16px";
      pill.style.right = "16px";
      pill.style.zIndex = "999999";
      pill.style.padding = "6px 12px";
      pill.style.borderRadius = "8px";
      pill.style.background = "#000000";
      pill.style.border = "1px solid #404040";
      pill.style.color = "#ffffff";
      pill.style.fontFamily = "monospace";
      pill.style.fontSize = "11px";
      pill.style.fontWeight = "bold";
      pill.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.3)";
      pill.style.display = "flex";
      pill.style.alignItems = "center";
      pill.style.gap = "6px";
      pill.style.pointerEvents = "auto";
      pill.style.transition = "all 0.3s ease";

      const label = timerState === "FLOW" ? "DEEP FOCUS ACTIVE" : "POMODORO ACTIVE";
      pill.innerHTML = `
        <span style="width: 6px; height: 6px; border-radius: 50%; background-color: #ffffff; display: inline-block;"></span>
        <span>${label}</span>
      `;

      if (document.body) {
        document.body.appendChild(pill);
      } else {
        window.addEventListener("DOMContentLoaded", () => {
          if (!document.getElementById("focus-ext-floating-pill")) {
            document.body?.appendChild(pill);
          }
        });
      }
    }
  } else if (existing) {
    existing.remove();
  }
}

// Content script for Focus Extension
(async () => {
  const state = await getStoredState();
  renderPill(state.isActive, state.timerState);

  subscribeToStateChanges((newState) => {
    renderPill(newState.isActive, newState.timerState);
  });
})();

