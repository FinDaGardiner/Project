const fontSizeSelect = document.getElementById("fontSizeSelect");
const resetBtn = document.getElementById("resetFontBtn");

// Load saved value into the dropdown
const saved = localStorage.getItem("fontScale");
if (saved) {
  fontSizeSelect.value = saved;
} else {
  fontSizeSelect.value = "100";
}

// Change font size + save
fontSizeSelect.addEventListener("change", () => {
  const value = fontSizeSelect.value;
  document.documentElement.style.setProperty("--font-scale", value + "%");
  localStorage.setItem("fontScale", value);
});

// Reset to default
resetBtn.addEventListener("click", () => {
  localStorage.removeItem("fontScale");
  document.documentElement.style.setProperty("--font-scale", "100%");
  fontSizeSelect.value = "100";
});
