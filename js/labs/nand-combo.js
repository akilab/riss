(() => {
  "use strict";
  const lab = document.querySelector("[data-nand-lab]");
  if (!lab) return;
  const NS = "http://www.w3.org/2000/svg";
  const nand = (x, y) => 1 - (x & y);
  // 各回路の図は固定の座標で描き、線ごとに「どの信号を運ぶか」を持たせる。
  const circuits = [
    {
      answer: "NOT", single: true,
      evaluate: ({ A }) => ({ Y: nand(A, A) }),
      inputs: { A: 130 }, gates: [[220, 105]],
      wires: [["A", "M60 130H180M180 130V120H220M180 130V140H220"], ["Y", "M292 130H430"]],
      dots: [["A", 180, 130]], labels: [], output: [440, 138]
    },
    {
      answer: "AND", single: false,
      evaluate: ({ A, B }) => { const N1 = nand(A, B); return { N1, Y: nand(N1, N1) }; },
      inputs: { A: 100, B: 160 }, gates: [[160, 105], [320, 105]],
      wires: [["A", "M60 100H130V120H160"], ["B", "M60 160H130V140H160"], ["N1", "M232 130H290M290 130V120H320M290 130V140H320"], ["Y", "M392 130H470"]],
      dots: [["N1", 290, 130]], labels: [["N1", 238, 120]], output: [480, 138]
    },
    {
      answer: "OR", single: false,
      evaluate: ({ A, B }) => { const N1 = nand(A, A); const N2 = nand(B, B); return { N1, N2, Y: nand(N1, N2) }; },
      inputs: { A: 80, B: 180 }, gates: [[160, 55], [160, 155], [330, 105]],
      wires: [["A", "M60 80H130M130 80V70H160M130 80V90H160"], ["B", "M60 180H130M130 180V170H160M130 180V190H160"], ["N1", "M232 80H290V120H330"], ["N2", "M232 180H290V140H330"], ["Y", "M402 130H480"]],
      dots: [["A", 130, 80], ["B", 130, 180]], labels: [["N1", 238, 70], ["N2", 238, 202]], output: [490, 138]
    },
    {
      answer: "XOR", single: false,
      evaluate: ({ A, B }) => {
        const N1 = nand(A, B); const N2 = nand(A, N1); const N3 = nand(N1, B);
        return { N1, N2, N3, Y: nand(N2, N3) };
      },
      inputs: { A: 70, B: 190 }, gates: [[150, 105], [290, 55], [290, 155], [420, 105]],
      wires: [["A", "M60 70H290M110 70V120H150"], ["B", "M60 190H290M110 190V140H150"], ["N1", "M222 130H250M250 130V90H290M250 130V170H290"], ["N2", "M362 80H390V120H420"], ["N3", "M362 180H390V140H420"], ["Y", "M492 130H540"]],
      dots: [["A", 110, 70], ["B", 110, 190], ["N1", 250, 130]], labels: [["N1", 256, 136], ["N2", 366, 70], ["N3", 366, 202]], output: [544, 138]
    }
  ];
  let index = 0;
  let a = 0;
  let b = 0;
  // 回路ごとに、試した入力の組合せを覚えておく。
  const tried = circuits.map(() => new Set());
  const circuitButtons = [...lab.querySelectorAll("[data-circuit]")];
  const inputA = lab.querySelector("[data-nand-a]");
  const inputB = lab.querySelector("[data-nand-b]");
  const drawing = lab.querySelector("[data-nand-drawing]");
  const rows = lab.querySelector("[data-nand-rows]");

  function element(name, attributes, text) {
    const node = document.createElementNS(NS, name);
    for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function draw(circuit, signals) {
    const parts = [];
    for (const [name, d] of circuit.wires) parts.push(element("path", { class: "signal-wire", d, "data-signal": signals[name] }));
    for (const [name, cx, cy] of circuit.dots) parts.push(element("circle", { class: "signal-dot", cx, cy, r: 5, "data-signal": signals[name] }));
    for (const [x, y] of circuit.gates) {
      parts.push(element("path", { class: "gate-shape", d: `M${x} ${y}H${x + 30}C${x + 70} ${y} ${x + 70} ${y + 50} ${x + 30} ${y + 50}H${x}Z` }));
      parts.push(element("circle", { class: "gate-shape", cx: x + 66, cy: y + 25, r: 6 }));
      parts.push(element("text", { x: x + 28, y: y + 30, "text-anchor": "middle", class: "nand-name" }, "NAND"));
    }
    for (const [name, y] of Object.entries(circuit.inputs)) parts.push(element("text", { x: 4, y: y + 7, class: "svg-value" }, `${name}=${signals[name]}`));
    for (const [name, x, y] of circuit.labels) parts.push(element("text", { x, y, class: "nand-mid" }, `${name}=${signals[name]}`));
    parts.push(element("text", { x: circuit.output[0], y: circuit.output[1], class: "svg-value" }, `Y=${signals.Y}`));
    drawing.replaceChildren(...parts);
  }

  function render(message) {
    const circuit = circuits[index];
    if (circuit.single) b = 0;
    const signals = { A: a, B: b, ...circuit.evaluate({ A: a, B: b }) };
    const key = `${a}${b}`;
    tried[index].add(key);
    const combos = circuit.single ? ["00", "10"] : ["00", "01", "10", "11"];
    const done = combos.every(combo => tried[index].has(combo));
    const count = circuit.gates.length;
    circuitButtons.forEach((button, i) => button.setAttribute("aria-pressed", String(i === index)));
    inputA.textContent = `入力A：${a}`;
    inputA.setAttribute("aria-pressed", String(a === 1));
    inputB.textContent = `入力B：${b}`;
    inputB.setAttribute("aria-pressed", String(b === 1));
    inputB.hidden = circuit.single;
    draw(circuit, signals);
    const description = `${circuit.single ? `A=${a}` : `A=${a}、B=${b}`} → 回路${index + 1}（NAND ${count}個） → Y=${signals.Y}`;
    lab.querySelector("[data-nand-desc]").textContent = description;
    lab.querySelector("[data-nand-result]").textContent = description;
    const reason = done
      ? `${combos.length}通りそろいました。回路${index + 1}は「${circuit.answer}」と同じです。NANDを${count}個つなぐだけで作れました。`
      : `試した組合せ：${combos.filter(combo => tried[index].has(combo)).length} / ${combos.length}。全部試すと、何の演算と同じか分かります。`;
    lab.querySelector("[data-nand-reason]").textContent = reason;
    if (message) lab.querySelector("[data-nand-status]").textContent = `${message}。${description}。${reason}`;
    lab.querySelector("[data-nand-b-heading]").hidden = circuit.single;
    lab.querySelector("[data-nand-caption]").textContent = done ? `回路${index + 1}の真理値表（${circuit.answer}と同じ）` : `回路${index + 1}の真理値表（試した入力だけYが分かる）`;
    rows.replaceChildren();
    for (const combo of combos) {
      const [rowA, rowB] = [...combo].map(Number);
      const current = combo === key;
      const row = document.createElement("tr");
      if (current) row.setAttribute("aria-current", "true");
      const y = tried[index].has(combo) ? String(circuit.evaluate({ A: rowA, B: rowB }).Y) : "?";
      for (const text of [rowA, ...(circuit.single ? [] : [rowB]), y, current ? "現在" : "—"]) {
        const cell = document.createElement("td");
        cell.textContent = String(text);
        row.append(cell);
      }
      rows.append(row);
    }
  }

  circuitButtons.forEach((button, i) => button.addEventListener("click", () => {
    index = i;
    a = b = 0;
    render(`回路${i + 1}にしました`);
  }));
  inputA.addEventListener("click", () => { a = 1 - a; render(`入力Aを${a}にしました`); });
  inputB.addEventListener("click", () => { b = 1 - b; render(`入力Bを${b}にしました`); });
  lab.querySelector("[data-nand-reset]").addEventListener("click", () => {
    tried.forEach(set => set.clear());
    a = b = 0;
    render("試した記録を消しました");
  });
  render();
  lab.hidden = false;
})();
