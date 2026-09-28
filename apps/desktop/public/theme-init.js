// Runs synchronously in <head> before first paint to prevent a white flash
// when the stored theme is dark. Mirrors the theme persisted by zustand
// (`focus-desktop-storage-v1` -> { state: { theme } }).
(function () {
  var DARK_BG = "oklch(0.145 0 0)";
  var LIGHT_BG = "oklch(1 0 0)";
  try {
    var theme = "dark";
    try {
      var raw = localStorage.getItem("focus-desktop-storage-v1");
      if (raw) {
        var parsed = JSON.parse(raw);
        theme =
          (parsed && parsed.state && parsed.state.theme) ||
          (parsed && parsed.theme) ||
          "dark";
      }
    } catch (e) {}
    var isDark = theme !== "light";
    var el = document.documentElement;
    if (isDark) {
      el.classList.add("dark");
    } else {
      el.classList.remove("dark");
    }
    try {
      el.style.colorScheme = isDark ? "dark" : "light";
    } catch (e) {}
    var bg = isDark ? DARK_BG : LIGHT_BG;
    try {
      el.style.backgroundColor = bg;
    } catch (e) {}
    var applyBody = function () {
      try {
        if (document.body) document.body.style.backgroundColor = bg;
      } catch (e) {}
    };
    if (document.body) {
      applyBody();
    } else {
      document.addEventListener("DOMContentLoaded", applyBody);
    }
  } catch (e) {
    try {
      document.documentElement.classList.add("dark");
    } catch (e2) {}
  }
})();
