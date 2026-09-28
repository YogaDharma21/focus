// Runs synchronously in <head> before first paint to prevent a white flash
// when the stored theme is dark. MV3 extension pages block inline scripts,
// so this must stay an external file referenced via <script src>.
//
// Theme sources (first sync hit wins, defaults to dark to match DEFAULT_STATE):
//   1. Lightweight mirror `focus_extension_theme` ("dark" | "light") written
//      synchronously by storage.ts on every save.
//   2. Full state `focus_extension_state_v6` in localStorage (dev fallback path).
// An async chrome.storage.local read corrects the class ASAP when the mirror
// is missing or stale, still well before React's useEffect paints.
(function () {
  var STORAGE_KEY = "focus_extension_state_v6";
  var THEME_MIRROR_KEY = "focus_extension_theme";
  var DARK_BG = "oklch(0.145 0 0)";
  var LIGHT_BG = "oklch(1 0 0)";

  function apply(mode) {
    var isDark = mode !== "light";
    var el = document.documentElement;
    if (isDark) {
      el.classList.add("dark");
      el.classList.remove("light");
    } else {
      el.classList.remove("dark");
      el.classList.add("light");
    }
    try {
      el.style.colorScheme = isDark ? "dark" : "light";
    } catch (e) {}
    var bg = isDark ? DARK_BG : LIGHT_BG;
    try {
      el.style.backgroundColor = bg;
    } catch (e) {}
    try {
      if (document.body) document.body.style.backgroundColor = bg;
    } catch (e) {}
    return isDark;
  }

  function readSync() {
    try {
      var mirror = localStorage.getItem(THEME_MIRROR_KEY);
      if (mirror === "dark" || mirror === "light") return mirror;
    } catch (e) {}
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        var mode =
          (parsed && parsed.themeMode) ||
          (parsed && parsed.state && parsed.state.themeMode) ||
          null;
        if (mode === "dark" || mode === "light") return mode;
      }
    } catch (e) {}
    return "dark";
  }

  var initial = readSync();
  apply(initial);

  // Correct early from chrome.storage when the sync mirror missed.
  try {
    if (
      typeof chrome !== "undefined" &&
      chrome.storage &&
      chrome.storage.local &&
      chrome.storage.local.get
    ) {
      chrome.storage.local.get([STORAGE_KEY], function (result) {
        try {
          var val = result && result[STORAGE_KEY];
          if (!val) return;
          var mode =
            val.themeMode ||
            (val.state && val.state.themeMode) ||
            null;
          if (mode !== "dark" && mode !== "light") return;
          apply(mode);
          try {
            localStorage.setItem(THEME_MIRROR_KEY, mode);
          } catch (e) {}
        } catch (e) {}
      });
    }
  } catch (e) {}

  document.addEventListener("DOMContentLoaded", function () {
    try {
      apply(readSync());
    } catch (e) {}
  });
})();
