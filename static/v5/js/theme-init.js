/* Minimal 3D design: dark by default; remembers an explicit choice. Runs before paint. */
(function () {
  var theme = "dark";
  try {
    var saved = localStorage.getItem("portfolio-theme-v5");
    if (saved === "light" || saved === "dark") theme = saved;
  } catch (e) { /* storage unavailable */ }
  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.setAttribute("data-bs-theme", theme);
})();
