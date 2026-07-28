import { getStoredState } from "../lib/storage";

// Content script for Focus Extension
(async () => {
  const state = await getStoredState();
  if (state.isActive && state.timerState === "WORK") {
    // Inject a minimalist monochrome focus pill on active page if timer is running
    if (document.getElementById("focus-ext-floating-pill")) return;

    const isDark = state.themeMode === "dark";
    const pill = document.createElement("div");
    pill.id = "focus-ext-floating-pill";
    pill.style.position = "fixed";
    pill.style.bottom = "16px";
    pill.style.right = "16px";
    pill.style.zIndex = "999999";
    pill.style.padding = "6px 12px";
    pill.style.borderRadius = "8px";
    pill.style.background = isDark ? "#000000" : "#ffffff";
    pill.style.border = isDark ? "1px solid #404040" : "1px solid #d4d4d4";
    pill.style.color = isDark ? "#ffffff" : "#000000";
    pill.style.fontFamily = "monospace";
    pill.style.fontSize = "11px";
    pill.style.fontWeight = "bold";
    pill.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.3)";
    pill.style.display = "flex";
    pill.style.alignItems = "center";
    pill.style.gap = "6px";
    pill.style.pointerEvents = "auto";
    pill.style.transition = "all 0.3s ease";

    pill.innerHTML = `
      <span style="width: 6px; height: 6px; border-radius: 50%; background-color: ${isDark ? '#ffffff' : '#000000'}; display: inline-block;"></span>
      <span>POMODORO ACTIVE</span>
    `;

    document.body.appendChild(pill);
  }
})();
