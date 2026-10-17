(() => {
  "use strict";
  const lab = document.querySelector("[data-number-lab]");
  if (!lab) return;
  let value = 178;
  let composing = false;
  const buttons = [...lab.querySelectorAll("[data-bit-weight]")];
  const form = lab.querySelector("form");
  const input = lab.querySelector("#number-input");
  const base = lab.querySelector("#number-base");
  const error = lab.querySelector("[data-input-error]");
  const announce = lab.querySelector("[data-lab-status]");
  const reason = lab.querySelector("[data-lab-reason]");
  const formats = {
    2: { pattern: /^[01]+$/, digits: 8, label: "2進数の値（0と1で8桁まで）", hint: "0と1だけで入力してください。", example: "例：10110010。全角の数字も使えます。" },
    10: { pattern: /^\d+$/, digits: 1, label: "10進数の値（0〜255）", hint: "0〜255の整数を入力してください。", example: "例：178。全角の数字も使えます。" },
    16: { pattern: /^[0-9A-F]+$/, digits: 2, label: "16進数の値（0〜9・A〜Fで2桁まで）", hint: "0〜9とA〜Fだけで入力してください。", example: "例：B2。小文字や全角も使えます。" }
  };
  const RANGE_MESSAGE = "8bitで表せるのは0〜255までです（2進数なら11111111、16進数ならFFまで）。";

  function clearError() {
    error.textContent = "";
    input.removeAttribute("aria-invalid");
  }
  function syncInput() {
    const radix = Number(base.value);
    input.value = value.toString(radix).toUpperCase().padStart(formats[radix].digits, "0");
    clearError();
  }
  function render(message) {
    const active = [];
    buttons.forEach(button => {
      const weight = Number(button.dataset.bitWeight);
      const on = (value & weight) !== 0;
      button.textContent = on ? "1" : "0";
      button.setAttribute("aria-pressed", String(on));
      button.parentElement.classList.toggle("is-on", on);
      if (on) active.push(weight);
    });
    lab.querySelector("[data-equation]").textContent = `${active.length ? active.join(" + ") : "0"} = ${value}`;
    lab.querySelector("[data-binary]").textContent = value.toString(2).padStart(8, "0");
    lab.querySelector("[data-decimal]").textContent = String(value);
    lab.querySelector("[data-hex]").textContent = value.toString(16).toUpperCase().padStart(2, "0");
    reason.textContent = !active.length ? "すべてのbitが0なので、重みの合計も0です。" :
      `${message ? "" : "最初は本文の例と同じ178です。"}1になっているbitの重みだけを足しています。表し方が違っても、3つとも同じ値です。`;
    if (message) announce.textContent = `${message}。10進数の値は${value}です。`;
  }
  buttons.forEach(button => button.addEventListener("click", () => {
    const weight = Number(button.dataset.bitWeight);
    const on = (value & weight) === 0;
    value ^= weight;
    render(`重み${weight}のbitを${on ? "1" : "0"}にしました`);
    reason.textContent = `重み${weight}のbitを${on ? "1" : "0"}にしたので、値が${weight}${on ? "増え" : "減り"}ました。1のbitの重みを足すと${value}です。`;
    syncInput();
  }));
  input.addEventListener("compositionstart", () => { composing = true; });
  input.addEventListener("compositionend", () => { composing = false; });
  input.addEventListener("input", () => { if (!composing) clearError(); });
  form.addEventListener("keydown", event => {
    if (event.key === "Enter" && (event.isComposing || composing)) event.preventDefault();
  });
  base.addEventListener("change", () => {
    input.inputMode = base.value === "16" ? "text" : "numeric";
    lab.querySelector("[data-input-label]").textContent = formats[base.value].label;
    lab.querySelector("[data-input-hint]").textContent = formats[base.value].example;
    syncInput();
  });
  form.addEventListener("submit", event => {
    event.preventDefault();
    if (composing) return;
    const text = input.value.trim().normalize("NFKC").toUpperCase();
    const radix = Number(base.value);
    // parseIntの前に全体を検証し、途中までの解析を受け付けない。
    const parsed = formats[radix].pattern.test(text) ? parseInt(text, radix) : NaN;
    if (!Number.isInteger(parsed) || parsed > 255) {
      error.textContent = Number.isInteger(parsed) ? RANGE_MESSAGE : formats[radix].hint;
      input.setAttribute("aria-invalid", "true");
      input.focus();
      return;
    }
    value = parsed;
    render(`${radix}進数の入力を反映しました`);
    syncInput();
  });
  lab.querySelector("[data-lab-reset]").addEventListener("click", () => {
    value = 178;
    render("例の178に戻しました");
    syncInput();
  });
  render();
  syncInput();
  lab.hidden = false;
})();
