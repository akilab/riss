(() => {
  "use strict";
  const lab = document.querySelector("[data-register-lab]");
  if (!lab) return;
  // inputs：入ってくる値（上の4bit）。stored：レジスタが覚えている値。どちらも重み8・4・2・1の順。
  let inputs = [0, 0, 0, 0];
  let stored = [0, 0, 0, 0];
  let timer = null;
  const buttons = [...lab.querySelectorAll("[data-register-bit]")];
  const toNumber = bits => bits.reduce((sum, bit, i) => sum + bit * 2 ** (3 - i), 0);
  const toText = bits => bits.join("");

  function render(reason, clock = 0) {
    buttons.forEach((button, i) => {
      button.textContent = `${button.dataset.weight}：${inputs[i]}`;
      button.setAttribute("aria-pressed", String(inputs[i] === 1));
      button.setAttribute("aria-label", `重み${button.dataset.weight}のbitを切り替える（今は${inputs[i]}）`);
    });
    inputs.forEach((bit, i) => {
      lab.querySelector(`[data-register-wire="in${i + 1}"]`).dataset.signal = String(bit);
      lab.querySelector(`[data-register-value="in${i + 1}"]`).textContent = String(bit);
    });
    stored.forEach((bit, i) => {
      lab.querySelector(`[data-register-wire="out${i + 1}"]`).dataset.signal = String(bit);
      lab.querySelector(`[data-register-value="out${i + 1}"]`).textContent = String(bit);
    });
    lab.querySelector('[data-register-wire="clock"]').dataset.signal = String(clock);
    lab.querySelector('[data-register-value="dec"]').textContent = `=${toNumber(stored)}`;
    const result = `覚えている値：${toText(stored)}（10進数で${toNumber(stored)}）`;
    lab.querySelector("[data-register-result]").textContent = result;
    lab.querySelector("[data-register-reason]").textContent = reason;
    lab.querySelector("[data-register-desc]").textContent = `入ってくる値${toText(inputs)}。${result}。`;
    lab.querySelector("[data-register-status]").textContent = `${result}。${reason}`;
  }

  buttons.forEach((button, i) => button.addEventListener("click", () => {
    inputs[i] = 1 - inputs[i];
    const same = toText(inputs) === toText(stored);
    render(same
      ? `入ってくる値が${toText(inputs)}（${toNumber(inputs)}）になりました。覚えている値と同じです。`
      : `入ってくる値が${toText(inputs)}（${toNumber(inputs)}）になりました。まだ「書き込む」の合図がないので、覚えている値は変わりません。`);
  }));
  lab.querySelector("[data-register-write]").addEventListener("click", () => {
    clearTimeout(timer);
    stored = [...inputs];
    const reason = `「書き込む」の合図で、4つのフリップフロップが同時に${toText(stored)}を取り込みました（10進数で${toNumber(stored)}）。`;
    render(reason, 1);
    // 合図は一瞬だけなので、少し後に合図の線を0に戻す。
    timer = setTimeout(() => render(`${reason}このあと入ってくる値が変わっても、覚えている値は変わりません。`), 600);
  });
  lab.querySelector("[data-register-reset]").addEventListener("click", () => {
    clearTimeout(timer);
    inputs = [0, 0, 0, 0];
    stored = [0, 0, 0, 0];
    render("最初に戻しました。入ってくる値で数を作ってから「書き込む」を押しましょう。");
  });
  render("入ってくる値で11（1011）を作ってから「書き込む」を押しましょう。そのあと入ってくる値を変えてみてください。");
  lab.hidden = false;
})();
