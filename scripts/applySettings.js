const savedFontScale = localStorage.getItem("fontScale");

if (savedFontScale) {
  document.documentElement.style.setProperty(
    "--font-scale",
    savedFontScale + "%"
  );
} else {
  document.documentElement.style.setProperty("--font-scale", "100%");
}
