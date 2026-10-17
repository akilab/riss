(() => {
  "use strict";
  const lab = document.querySelector("[data-io-lab]");
  if (!lab) return;
  // 教育用：3つの方式を同じ時間軸で同時に進める。1枠＝1単位の架空の時間。
  // 同じ1台のCPUで、確認だけを繰り返すポーリング、3単位ごとに確認するポーリング、割込みを比べる。
  const CELLS = 12;
  const PERIOD = 3;
  const CELL_WIDTH = 46;
  const LEFT = 130;
  const ROW_HEIGHT = 42;
  const STATS_X = LEFT + CELLS * CELL_WIDTH + 20;
  const ROWS = [
    { id: "every", y: 34, name: "ポーリング", sub: "確認だけ繰り返す" },
    { id: "periodic", y: 86, name: "ポーリング", sub: `${PERIOD}単位ごと` },
    { id: "interrupt", y: 138, name: "割込み", sub: "合図で知る" }
  ];
  const SVG_NS = "http://www.w3.org/2000/svg";
  const svg = lab.querySelector("[data-io-timeline]");
  const next = lab.querySelector("[data-io-next]");
  const key = lab.querySelector("[data-io-key]");
  let step, presses, state;

  function create(name, attributes, text) {
    const element = document.createElementNS(SVG_NS, name);
    for (const [attribute, value] of Object.entries(attributes)) element.setAttribute(attribute, value);
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function createTimeline() {
    const add = (...args) => svg.append(create(...args));
    add("text", { x: 10, y: 24, class: "io-note" }, "時刻");
    add("text", { x: STATS_X + 35, y: 24, "text-anchor": "middle", class: "io-note" }, "進んだ計算");
    add("text", { x: STATS_X + 120, y: 24, "text-anchor": "middle", class: "io-note" }, "受け取るまで");
    for (const row of ROWS) {
      add("text", { x: 10, y: row.y + 18, class: "io-row-label" }, row.name);
      add("text", { x: 10, y: row.y + 37, class: "io-note" }, row.sub);
      add("text", { x: STATS_X + 35, y: row.y + 27, "text-anchor": "middle", class: "io-stat", "data-io-calc": row.id });
      add("text", { x: STATS_X + 120, y: row.y + 27, "text-anchor": "middle", class: "io-stat", "data-io-delay": row.id });
    }
    for (let i = 0; i < CELLS; i++) {
      const x = LEFT + i * CELL_WIDTH;
      add("text", { x: x + CELL_WIDTH / 2, y: 24, "text-anchor": "middle", class: "io-time" }, String(i + 1));
      for (const row of ROWS) {
        add("rect", { x: x + 2, y: row.y, width: CELL_WIDTH - 4, height: ROW_HEIGHT, rx: 4, class: "io-cell", "data-io-cell": `${row.id}-${i}` });
        add("text", { x: x + CELL_WIDTH / 2, y: row.y + 27, "text-anchor": "middle", class: "io-cell-label", "data-io-label": `${row.id}-${i}` });
      }
    }
    add("g", { "data-io-markers": "" });
  }

  function reset(announce) {
    step = 0;
    presses = [];
    state = Object.fromEntries(ROWS.map(row => [row.id, { slots: [], pending: null, delay: null }]));
    render(announce, null);
  }

  function slotFor(id, time) {
    const row = state[id];
    const calc = row.slots.filter(slot => slot.kind === "calc").length + 1;
    const waited = row.pending === null ? 0 : time - row.pending;
    const receive = text => ({ kind: "receive", short: "受取", text: `${text}（押されてから${waited}単位）。` });
    const nextCheck = Math.ceil((time + 1) / PERIOD) * PERIOD;
    if (id === "every") {
      return row.pending !== null ? receive("確認すると押されていたので受け取った") :
        { kind: "check", short: "確認", text: "確認したが、まだ押されていない。この待ち方では計算に手を回さず、すぐ確認に戻る。" };
    }
    if (id === "periodic") {
      if (time % PERIOD === 0) {
        return row.pending !== null ? receive("確認すると押されていたので受け取った") :
          { kind: "check", short: "確認", text: "確認したが、まだ押されていないので計算に戻る。" };
      }
      return { kind: "calc", short: `計${calc}`, text: row.pending !== null ?
        `計算${calc}を進めた。キーは押されているが、次の確認（時刻${nextCheck}）まで気付けない。` :
        `計算${calc}を進めた。次の確認は時刻${nextCheck}。` };
    }
    return row.pending !== null ?
      receive("合図が来たので、PCを退避→キーを受取→復帰した") :
      { kind: "calc", short: `計${calc}`, text: `計算${calc}を進めた。押されたら合図が来るので見張らなくてよい。` };
  }

  function advance() {
    if (step >= CELLS) return;
    const time = step + 1;
    const lines = ROWS.map(row => {
      const slot = slotFor(row.id, time);
      const target = state[row.id];
      if (slot.kind === "receive") {
        target.delay = time - target.pending;
        target.pending = null;
      }
      target.slots.push(slot);
      return [`${row.name}（${row.sub}）`, slot.text];
    });
    step = time;
    render(true, lines);
  }

  function pressKey() {
    if (step >= CELLS || ROWS.some(row => state[row.id].pending !== null)) return;
    for (const row of ROWS) state[row.id].pending = step;
    presses.push(step);
    render(true, [["キー", `${step ? `時刻${step}の終わり` : "時刻1の前"}に押した。3つの行は、それぞれいつ受け取るでしょうか？`]]);
  }

  function render(announce, lines) {
    for (const row of ROWS) {
      const { slots, delay, pending } = state[row.id];
      for (let i = 0; i < CELLS; i++) {
        const cell = lab.querySelector(`[data-io-cell="${row.id}-${i}"]`);
        cell.dataset.kind = slots[i]?.kind || "";
        cell.classList.toggle("io-current", i === step - 1);
        lab.querySelector(`[data-io-label="${row.id}-${i}"]`).textContent = slots[i]?.short || "";
      }
      lab.querySelector(`[data-io-calc="${row.id}"]`).textContent = `${slots.filter(slot => slot.kind === "calc").length}個`;
      lab.querySelector(`[data-io-delay="${row.id}"]`).textContent = pending !== null ? "待たせ中" : delay === null ? "—" : `${delay}単位`;
    }
    lab.querySelector("[data-io-markers]").replaceChildren(...presses.map(time => {
      const x = LEFT + time * CELL_WIDTH;
      const group = create("g", {});
      group.append(create("path", { d: `M${x} 30V184`, class: "io-arrival" }),
        create("text", { x, y: 200, "text-anchor": "middle", class: "io-note" }, "▲キー"));
      return group;
    }));

    const waiting = ROWS.some(row => state[row.id].pending !== null);
    lab.querySelector("[data-io-key-state]").textContent = waiting ? "キー：押された（受け取っていない行あり）" :
      presses.length ? "キー：全行が受け取り済み" : "キー：まだ押していない";
    const shown = lines || [["操作", "「1単位進める」を何回か押し、好きなときに「キーを押す」を押してください。"]];
    lab.querySelector("[data-io-lines]").replaceChildren(...shown.map(([label, text]) => {
      const line = document.createElement("p");
      line.append(Object.assign(document.createElement("b"), { textContent: `${label}：` }), text);
      return line;
    }));
    const done = !waiting && ROWS.every(row => state[row.id].delay !== null);
    const conclusion = !done ? "" : state.periodic.delay > state.every.delay ?
      "ポーリングは、確認を増やすと計算が進まず、減らすと気付くのが遅れます。割込みは、計算を進めながらすぐに気付けます。" :
      `今回は、キーを押した直後に「${PERIOD}単位ごと」の確認がちょうど来たので、遅れませんでした。押すタイミングを変えて、もう一度試してみましょう。`;
    lab.querySelector("[data-io-conclusion]").textContent = conclusion;
    next.disabled = step >= CELLS;
    next.textContent = step >= CELLS ? `${CELLS}単位で終わりです` : "1単位進める";
    key.disabled = waiting || step >= CELLS;
    const stats = ROWS.map(row => `${row.name}（${row.sub}）：${state[row.id].slots.map(slot => slot.short).join("、") || "なし"}、進んだ計算${lab.querySelector(`[data-io-calc="${row.id}"]`).textContent}、受け取るまで${lab.querySelector(`[data-io-delay="${row.id}"]`).textContent}。`);
    lab.querySelector("[data-io-desc]").textContent = `時刻${step}まで。${stats.join("")}`;
    if (announce) lab.querySelector("[data-io-status]").textContent = `${shown.map(([label, text]) => `${label}：${text}`).join(" ")} ${conclusion}`;
  }

  next.addEventListener("click", advance);
  key.addEventListener("click", pressKey);
  lab.querySelector("[data-io-reset]").addEventListener("click", () => reset(true));
  createTimeline();
  reset(false);
  lab.hidden = false;
})();
