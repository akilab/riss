(() => {
  "use strict";
  const lab = document.querySelector("[data-logic-lab]");
  if (!lab) return;
  let a = 0;
  let b = 0;
  const select = lab.querySelector("select");
  const gates = {
    AND: { calculate: (a, b) => a & b, rule: "両方が1のときだけ1になります。", shape: "M205 60 H260 C355 60 355 190 260 190 H205 Z" },
    OR: { calculate: (a, b) => a | b, rule: "少なくとも一方が1なら1になります。両方が1でも1です。", shape: "M200 60 Q280 55 345 125 Q280 195 200 190 Q240 125 200 60 Z" },
    XOR: { calculate: (a, b) => a ^ b, rule: "入力が異なるときだけ1になります。両方が1のときは0です。", shape: "M200 60 Q280 55 345 125 Q280 195 200 190 Q240 125 200 60 Z" },
    NOT: { calculate: a => 1 - a, rule: "入力を反転します。0なら1、1なら0です。入力は1つだけです。", shape: "M205 60 L330 125 L205 190 Z" },
    NAND: { calculate: (a, b) => 1 - (a & b), rule: "ANDの結果を反転します。両方が1のときだけ0になります。", shape: "M205 60 H260 C355 60 355 190 260 190 H205 Z" }
  };
  const inputA = lab.querySelector("[data-input-a]");
  const inputB = lab.querySelector("[data-input-b]");
  const tbody = lab.querySelector("tbody");

  function render(announce = false) {
    const name = select.value;
    const gate = gates[name];
    const single = name === "NOT";
    const y = gate.calculate(a, b);
    inputA.textContent = `入力A：${a}`;
    inputA.setAttribute("aria-pressed", String(a === 1));
    inputB.textContent = `入力B：${b}`;
    inputB.setAttribute("aria-pressed", String(b === 1));
    inputB.hidden = single;
    lab.querySelector("[data-b-signal]").style.display = single ? "none" : "";
    lab.querySelector("[data-wire-a]").setAttribute("d", single ? "M80 125 H205" : "M80 85 H215");
    lab.querySelector("[data-a-value]").setAttribute("y", single ? "135" : "95");
    lab.querySelector("[data-gate-shape]").setAttribute("d", gate.shape);
    lab.querySelector("[data-wire-y]").setAttribute("d", `M${name === "AND" ? 331 : name === "NOT" || name === "NAND" ? 346 : 345} 125H435`);
    lab.querySelector("[data-gate-name]").textContent = name;
    lab.querySelector("[data-xor-line]").style.display = name === "XOR" ? "" : "none";
    lab.querySelector("[data-invert-bubble]").style.display = name === "NOT" || name === "NAND" ? "" : "none";
    const description = `${single ? `A=${a}` : `A=${a}、B=${b}`} → ${name} → Y=${y}`;
    lab.querySelector("[data-diagram-desc]").textContent = description;
    lab.querySelector("[data-a-value]").textContent = `A=${a}`;
    lab.querySelector("[data-b-value]").textContent = `B=${b}`;
    lab.querySelector("[data-y-value]").textContent = `Y=${y}`;
    for (const [part, bit] of [["a", a], ["b", b], ["y", y]]) {
      lab.querySelector(`[data-wire-${part}]`).dataset.signal = String(bit);
    }
    lab.querySelector("[data-logic-result]").textContent = description;
    lab.querySelector("[data-logic-reason]").textContent = gate.rule;
    if (announce) lab.querySelector("[data-logic-status]").textContent = `${description}。${gate.rule}`;
    lab.querySelector("[data-b-heading]").hidden = single;
    lab.querySelector("caption").textContent = `${name}の真理値表（「現在」が今の入力）`;
    tbody.replaceChildren();
    for (const [rowA, rowB] of single ? [[0, 0], [1, 0]] : [[0, 0], [0, 1], [1, 0], [1, 1]]) {
      const current = rowA === a && (single || rowB === b);
      const row = document.createElement("tr");
      if (current) row.setAttribute("aria-current", "true");
      for (const text of [rowA, ...(single ? [] : [rowB]), gate.calculate(rowA, rowB), current ? "現在" : "—"]) {
        const cell = document.createElement("td");
        cell.textContent = String(text);
        row.append(cell);
      }
      tbody.append(row);
    }
  }
  inputA.addEventListener("click", () => { a = 1 - a; render(true); });
  inputB.addEventListener("click", () => { b = 1 - b; render(true); });
  select.addEventListener("change", () => { render(true); });
  lab.querySelector("[data-logic-reset]").addEventListener("click", () => { a = b = 0; select.value = "AND"; render(true); });
  render();
  lab.hidden = false;
})();
