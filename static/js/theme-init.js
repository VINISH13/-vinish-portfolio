/* Applies the saved (or OS-preferred) theme before first paint to prevent a flash. */
(function () {
  var theme = "dark";
  try {
    var saved = localStorage.getItem("portfolio-theme");
    if (saved === "light" || saved === "dark") {
      theme = saved;
    } else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches) {
      theme = "light";
    }
  } catch (e) { /* storage unavailable */ }
  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.setAttribute("data-bs-theme", theme);
})();
