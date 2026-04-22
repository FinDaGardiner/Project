const fontSizeSelect = document.getElementById("fontSizeSelect");
const resetBtn = document.getElementById("resetFontBtn");

const saved = localStorage.getItem("fontScale");
if (saved) {
  fontSizeSelect.value = saved;
} else {
  fontSizeSelect.value = "100";
}

fontSizeSelect.addEventListener("change", () => {
  const value = fontSizeSelect.value;
  document.documentElement.style.setProperty("--font-scale", value + "%");
  localStorage.setItem("fontScale", value);
});

resetBtn.addEventListener("click", () => {
  localStorage.removeItem("fontScale");
  document.documentElement.style.setProperty("--font-scale", "100%");
  fontSizeSelect.value = "100";
});
