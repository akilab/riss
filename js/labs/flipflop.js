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
      adder.querySelector("[data-adder-reason]").textContent = `一の位SはXORで${sum}、桁上がりCはANDで${carry}です。2進数はC、Sの順に読むので${carry}${sum}になります。`;
      adder.querySelector("[data-adder-desc]").textContent = `A=${a}、B=${b}。XORの出力S=${sum}、ANDの出力C=${carry}。`;
      if (announce) adder.querySelector("[data-adder-status]").textContent = result;
    }
    adder.querySelector('[data-adder-input="a"]').addEventListener("click", () => { a = 1 - a; render(true); });
    adder.querySelector('[data-adder-input="b"]').addEventListener("click", () => { b = 1 - b; render(true); });
    adder.querySelector("[data-adder-reset]").addEventListener("click", () => { a = b = 0; render(true); });
    render();
    adder.hidden = false;
  }

  const lab = document.querySelector("[data-flipflop-lab]");
  if (!lab) return;
  let d = 0;
  let clock = 0;
  let q = 0;
  let step = 0;
  let history = [{ step, d, clock, q, edge: false, event: "初期状態" }];
  const limit = 8;
  const svgNS = "http://www.w3.org/2000/svg";

  function drawTiming() {
    const chart = lab.querySelector("[data-timing-svg]");
    const grid = chart.querySelector("[data-timing-grid]");
    const waves = chart.querySelector("[data-timing-waves]");
    grid.replaceChildren();
    waves.replaceChildren();
    const width = 540;
    const left = 80;
    const gap = width / history.length;
    history.forEach((sample, index) => {
      const x = left + index * gap;
      const line = document.createElementNS(svgNS, "line");
      for (const [key, value] of Object.entries({ x1: x, x2: x, y1: 24, y2: 260, class: sample.edge ? "timing-edge" : "timing-grid" })) line.setAttribute(key, String(value));
      grid.append(line);
      const label = document.createElementNS(svgNS, "text");
      label.setAttribute("x", String(x + gap / 2));
      label.setAttribute("y", "284");
      label.setAttribute("text-anchor", "middle");
      label.setAttribute("class", "svg-note");
      label.textContent = String(sample.step);
      grid.append(label);
    });
    for (const [track, top] of [["d", 42], ["clock", 122], ["q", 202]]) {
      let points = "";
      history.forEach((sample, index) => {
        const x = left + index * gap;
        const y = top + (sample[track] ? 0 : 36);
        points += `${index ? " L" : "M"}${x} ${y} H${x + gap}`;
      });
      const path = document.createElementNS(svgNS, "path");
      path.setAttribute("d", points);
      path.setAttribute("class", "timing-wave");
      path.dataset.track = track;
      waves.append(path);
    }
    chart.querySelector("desc").textContent = `直近${history.length}状態のタイミングチャート。縦の点線はClockの立上りです。各状態の値は下の表でも読めます。`;
  }

  function render(message) {
    for (const [name, bit] of [["d", d], ["clock", clock], ["q", q]]) {
      lab.querySelector(`[data-ff-wire="${name}"]`).dataset.signal = String(bit);
      lab.querySelector(`[data-ff-value="${name}"]`).textContent = `${name === "clock" ? "Clock" : name.toUpperCase()}=${bit}`;
    }
    const dButton = lab.querySelector("[data-ff-d]");
    dButton.textContent = `入力D：${d}`;
    dButton.setAttribute("aria-pressed", String(d === 1));
    const clockButton = lab.querySelector("[data-ff-clock]");
    clockButton.textContent = `Clock：${clock} → ${1 - clock}にする`;
    clockButton.setAttribute("aria-pressed", String(clock === 1));
    lab.querySelector("[data-ff-result]").textContent = `入力D=${d} / Clock=${clock} / 保持しているQ=${q}`;
    lab.querySelector("[data-ff-desc]").textContent = `入力D=${d}、Clock=${clock}、出力Q=${q}のDフリップフロップ。`;
    lab.querySelector("[data-ff-reason]").textContent = message;
    lab.querySelector("[data-ff-status]").textContent = `${message} 現在のQは${q}です。`;
    lab.querySelector("[data-history-note]").textContent = step >= limit ? `直近${limit}状態を表示しています（操作${history[0].step}〜${step}）。` : "初期状態と、操作後の状態を記録しています。最大8状態を表示します。";
    const tbody = lab.querySelector("tbody");
    tbody.replaceChildren();
    for (const sample of history) {
      const row = document.createElement("tr");
      for (const text of [sample.step, sample.event, sample.d, sample.clock, sample.q]) {
        const cell = document.createElement("td");
        cell.textContent = String(text);
        row.append(cell);
      }
      tbody.append(row);
    }
    drawTiming();
  }

  function record(event, edge, message) {
    step++;
    history.push({ step, d, clock, q, edge, event });
    if (history.length > limit) history.shift();
    render(message);
  }
  lab.querySelector("[data-ff-d]").addEventListener("click", () => {
    d = 1 - d;
    record("Dを変更", false, `Dを${d}にしました。Clockの立上りがないので、Qは${q}を保持します。`);
  });
  lab.querySelector("[data-ff-clock]").addEventListener("click", () => {
    clock = 1 - clock;
    const rising = clock === 1;
    if (rising) q = d;
    record(rising ? "Clock ↑" : "Clock ↓", rising, rising ? `Clockが0から1になりました。この瞬間のD=${d}をQへ取り込みました。` : `Clockが1から0になりました。立下りでは取り込まず、Qは${q}を保持します。`);
  });
  lab.querySelector("[data-ff-reset]").addEventListener("click", () => {
    d = clock = q = step = 0;
    history = [{ step, d, clock, q, edge: false, event: "初期状態" }];
    render("実験を初期状態に戻しました。D=0、Clock=0、Q=0から始めます。");
  });
  render("まずDを1にしてみましょう。Clockが変わらなければ、Qは0のままです。");
  lab.hidden = false;
})();
