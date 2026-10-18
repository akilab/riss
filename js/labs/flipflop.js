(() => {
  "use strict";
  const adder = document.querySelector("[data-adder-lab]");
  if (adder) {
    let a = 0;
    let b = 0;
    function render(announce = false) {
      const sum = a ^ b;
      const carry = a & b;
      for (const [name, bit] of [["a", a], ["b", b], ["s", sum], ["c", carry]]) {
        adder.querySelectorAll(`[data-adder-wire="${name}"]`).forEach(wire => { wire.dataset.signal = String(bit); });
        adder.querySelector(`[data-adder-value="${name}"]`).textContent = `${name.toUpperCase()}=${bit}`;
      }
      for (const [name, bit] of [["a", a], ["b", b]]) {
        const button = adder.querySelector(`[data-adder-input="${name}"]`);
        button.textContent = `入力${name.toUpperCase()}：${bit}`;
        button.setAttribute("aria-pressed", String(bit === 1));
      }
      const result = `${a} + ${b} = ${a + b}（2進数では${carry}${sum}）`;
      adder.querySelector("[data-adder-result]").textContent = result;
      adder.querySelector("[data-adder-reason]").textContent = `一の位S（XOR）が${sum}、桁上がりC（AND）が${carry}。並べると2進数の${carry}${sum}です。`;
      adder.querySelector("[data-adder-desc]").textContent = `A=${a}、B=${b}。XORの出力S=${sum}、ANDの出力C=${carry}。`;
      if (announce) adder.querySelector("[data-adder-status]").textContent = result;
    }
    adder.querySelector('[data-adder-input="a"]').addEventListener("click", () => { a = 1 - a; render(true); });
    adder.querySelector('[data-adder-input="b"]').addEventListener("click", () => { b = 1 - b; render(true); });
    adder.querySelector("[data-adder-reset]").addEventListener("click", () => { a = b = 0; render(true); });
    render();
    adder.hidden = false;
  }

  const lab = document.querySelector("[data-memory-lab]");
  if (!lab) return;
  const nor = (x, y) => 1 - (x | y);
  let s = 0;
  let r = 0;
  let q = 0;
  let nq = 1;
  let log = [];
  // 出力を相手の入力へ戻す回路なので、値が落ち着くまで計算を繰り返す。
  function settle() {
    for (let i = 0; i < 4; i += 1) {
      q = nor(r, nq);
      nq = nor(s, q);
    }
  }
  function explain() {
    if (s === 1 && r === 1) return "SとRを同時に1にするのは「禁止」です。QもQの反対も0になり、覚える働きをしません。どちらかを0に戻しましょう。";
    if (s === 1) return "S=1なので、Qは1になりました（1を覚える）。";
    if (r === 1) return "R=1なので、Qは0になりました（0を覚える）。";
    return `SもRも0。それでもQ=${q}です。前に${q === 1 ? "S" : "R"}を1にしたことを覚えています。今の入力だけでは、出力が決まりません。`;
  }
  function render(action) {
    for (const [name, bit] of [["s", s], ["r", r], ["q", q], ["nq", nq]]) {
      lab.querySelectorAll(`[data-memory-wire="${name}"]`).forEach(wire => { wire.dataset.signal = String(bit); });
    }
    for (const [name, label, bit] of [["s", "S（セット）", s], ["r", "R（リセット）", r]]) {
      const button = lab.querySelector(`[data-memory-input="${name}"]`);
      button.textContent = `${label}：${bit}`;
      button.setAttribute("aria-pressed", String(bit === 1));
      lab.querySelector(`[data-memory-value="${name}"]`).textContent = `${name.toUpperCase()}=${bit}`;
    }
    lab.querySelector('[data-memory-value="q"]').textContent = `Q=${q}`;
    lab.querySelector('[data-memory-value="nq"]').textContent = `=${nq}`;
    const result = `S=${s}、R=${r} → Q=${q}`;
    const reason = explain();
    lab.querySelector("[data-memory-result]").textContent = result;
    lab.querySelector("[data-memory-reason]").textContent = reason;
    lab.querySelector("[data-memory-desc]").textContent = `${result}。Qの反対=${nq}。`;
    if (action) lab.querySelector("[data-memory-status]").textContent = `${result}。${reason}`;
    if (action) log = [[action, s, r, q], ...log].slice(0, 5);
    const rows = log.map(values => {
      const row = document.createElement("tr");
      for (const value of values) {
        const cell = document.createElement("td");
        cell.textContent = String(value);
        row.append(cell);
      }
      return row;
    });
    lab.querySelector("[data-memory-log]").replaceChildren(...rows);
  }
  lab.querySelectorAll("[data-memory-input]").forEach(button => button.addEventListener("click", () => {
    const name = button.dataset.memoryInput;
    if (name === "s") s = 1 - s;
    else r = 1 - r;
    settle();
    render(`${name.toUpperCase()}を${name === "s" ? s : r}にする`);
  }));
  lab.querySelector("[data-memory-reset]").addEventListener("click", () => {
    s = r = q = 0;
    nq = 1;
    log = [];
    settle();
    render();
    lab.querySelector("[data-memory-status]").textContent = "最初に戻しました。";
  });
  settle();
  render();
  lab.hidden = false;
})();
