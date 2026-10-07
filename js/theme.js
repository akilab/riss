(() => {
  "use strict";
  const key = "riss.a1.theme";
  const system = window.matchMedia("(prefers-color-scheme: dark)");
  let preference = null;
  let saved = true;
  try {
    const stored = localStorage.getItem(key);
    if (stored === "light" || stored === "dark") preference = stored;
  } catch {
    // 保存できない環境でも、システム設定と画面内の切替は利用できる。
  }

  function render() {
    const theme = preference || (system.matches ? "dark" : "light");
    document.documentElement.dataset.theme = theme;
    document.querySelectorAll("[data-theme-toggle]").forEach(button => {
      button.setAttribute("aria-pressed", String(theme === "dark"));
      button.textContent = `ダークモード：${theme === "dark" ? "オン" : "オフ"}`;
    });
    document.querySelectorAll("[data-theme-notice]").forEach(element => {
      element.hidden = saved;
      element.textContent = "配色を切り替えました。この環境では設定を保存できないため、次回は端末の配色設定に合わせます。";
    });
  }

  // headで実行し、本文を描画する前に保存済みの配色を適用する。
  render();
  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[data-theme-toggle]").forEach(button => {
      button.addEventListener("click", () => {
        preference = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
        try { localStorage.setItem(key, preference); saved = true; }
        catch { saved = false; }
        render();
      });
      button.hidden = false;
    });
    render();
  });
  system.addEventListener("change", () => { if (!preference) render(); });
  window.addEventListener("storage", event => {
    if (event.key !== key && event.key !== null) return;
    preference = event.newValue === "light" || event.newValue === "dark" ? event.newValue : null;
    saved = true;
    render();
  });
})();
