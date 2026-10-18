(() => {
  "use strict";
  const lab = document.querySelector("[data-cpu-lab]");
  if (!lab) return;
  // 教育用の命令。各命令を1番地に置き、取り出す・読み解く・実行するの3段階で進める。
  const program = [
    { op: "LOAD", address: 10, text: "10番地の数を読む", ir: "読む 10番地", meaning: "10番地の数をACCに読む命令です。" },
    { op: "ADD", address: 11, text: "11番地の数を足す", ir: "足す 11番地", meaning: "11番地の数を、ACCの数に足す命令です。" },
    { op: "STORE", address: 12, text: "12番地へ保存する", ir: "保存 12番地", meaning: "ACCの数を、12番地に書く命令です。" },
    { op: "HALT", text: "止める", ir: "止める", meaning: "プログラムを止める命令です。" }
  ];
  const stageNames = { fetch: "取り出す", decode: "読み解く", execute: "実行する" };
  const numberA = lab.querySelector("#cpu-number-a");
  const numberB = lab.querySelector("#cpu-number-b");
  const next = lab.querySelector("[data-cpu-next]");
  const label = lab.querySelector("[data-cpu-flow-label]");
  const pad = number => String(number).padStart(2, "0");
  let values = [12, 7];
  let state;

  function reset(message) {
    state = { pc: 0, ir: null, acc: 0, output: null, alu: "—", next: "fetch", stage: null, halted: false };
    numberA.value = String(values[0]);
    numberB.value = String(values[1]);
    clearErrors();
    render(message || "「次の段階へ」を押して、00番地の命令を取り出しましょう。", { nodes: [] });
  }

  function clearErrors() {
    lab.querySelector("[data-cpu-error]").textContent = "";
    for (const input of [numberA, numberB]) input.removeAttribute("aria-invalid");
  }

  // view.nodes：光らせる箱。view.flows：光らせる矢印。view.label：矢印の上に出す値と位置。
  function render(message, view) {
    lab.querySelector("[data-cpu-pc]").textContent = `${pad(state.pc)}番地`;
    lab.querySelector("[data-cpu-ir]").textContent = state.ir ? state.ir.ir : "—";
    lab.querySelector("[data-cpu-acc]").textContent = String(state.acc);
    lab.querySelector("[data-cpu-alu]").textContent = state.alu;
    lab.querySelector('[data-cpu-mem="10"]').textContent = String(values[0]);
    lab.querySelector('[data-cpu-mem="11"]').textContent = String(values[1]);
    lab.querySelector('[data-cpu-mem="12"]').textContent = state.output === null ? "まだ空" : String(state.output);
    lab.querySelectorAll("[data-cpu-node]").forEach(element => {
      element.classList.toggle("cpu-active", view.nodes.includes(element.dataset.cpuNode));
    });
    lab.querySelectorAll("[data-cpu-flow]").forEach(path => {
      path.classList.toggle("is-active", (view.flows || []).includes(path.dataset.cpuFlow));
    });
    if (view.label) {
      label.setAttribute("x", view.label.x);
      label.setAttribute("y", view.label.y);
      label.textContent = view.label.text;
    } else {
      label.textContent = "";
    }
    lab.querySelectorAll("[data-cpu-phase]").forEach(element => {
      if (element.dataset.cpuPhase === state.stage) element.setAttribute("aria-current", "step");
      else element.removeAttribute("aria-current");
    });
    lab.querySelector("[data-cpu-reason]").textContent = message;
    lab.querySelector("[data-cpu-status]").textContent = message;
    lab.querySelector("[data-cpu-desc]").textContent = `PC=${pad(state.pc)}番地、ACC=${state.acc}、12番地=${state.output === null ? "まだ空" : state.output}。${message}`;
    next.disabled = state.halted;
    next.textContent = state.halted ? "プログラムは止まりました" : `次の段階へ：${stageNames[state.next]}`;
  }

  next.addEventListener("click", () => {
    if (state.halted) return;
    const phase = state.next;
    state.stage = phase;
    state.alu = "—";
    if (phase === "fetch") {
      const address = state.pc;
      state.ir = program[address];
      state.pc++;
      state.next = "decode";
      // 取り出す行によって、矢印の出発点の高さを変える。
      lab.querySelector('[data-cpu-flow="fetch"]').setAttribute("d", `M280 ${64 + 40 * address}H430V40H655V68`);
      render(`PCが示す${pad(address)}番地から、命令「${state.ir.text}」を取り出してIRに置きました。PCは次の${pad(state.pc)}番地へ進みます。`,
        { nodes: ["pc", "ir", `m${address}`], flows: ["fetch"], label: { x: 545, y: 32, text: `「${state.ir.text}」` } });
    } else if (phase === "decode") {
      state.next = "execute";
      render(`制御装置が、IRの命令を読み解きました。${state.ir.meaning}まだ何も計算していません。`,
        { nodes: ["ir", "control"], flows: ["decode"] });
    } else {
      state.next = "fetch";
      const op = state.ir.op;
      if (op === "LOAD") {
        state.acc = values[0];
        render(`10番地の中身${values[0]}を読み、ACCに書き込みました。`,
          { nodes: ["m10", "acc"], flows: ["load"], label: { x: 560, y: 302, text: String(values[0]) } });
      } else if (op === "ADD") {
        const previous = state.acc;
        state.acc = previous + values[1];
        state.alu = `${previous}+${values[1]}=${state.acc}`;
        render(`11番地の${values[1]}とACCの${previous}をALUが足し、答え${state.acc}をACCに書き込みました。主記憶はまだ変わっていません。`,
          { nodes: ["m11", "alu", "acc"], flows: ["add-in", "acc-to-alu", "alu-to-acc"], label: { x: 400, y: 285, text: String(values[1]) } });
      } else if (op === "STORE") {
        state.output = state.acc;
        render(`ACCの${state.acc}を、主記憶の12番地に書き込みました。ここで初めて、答えが主記憶に残ります。`,
          { nodes: ["acc", "m12"], flows: ["store"], label: { x: 560, y: 325, text: String(state.acc) } });
      } else {
        state.halted = true;
        render("プログラムを止めました。12番地の答えとACCの数は、そのまま残ります。", { nodes: ["control"] });
      }
    }
  });

  const form = lab.querySelector("form");
  let composing = false;
  form.addEventListener("compositionstart", () => { composing = true; });
  form.addEventListener("compositionend", () => { composing = false; });
  form.addEventListener("keydown", event => {
    if (event.key === "Enter" && (composing || event.isComposing)) event.preventDefault();
  });
  form.addEventListener("submit", event => {
    event.preventDefault();
    if (composing) return;
    clearErrors();
    const inputs = [numberA, numberB];
    const parsed = inputs.map(input => {
      const text = input.value.trim().normalize("NFKC");
      return /^\d+$/.test(text) ? Number(text) : NaN;
    });
    const invalid = parsed.findIndex(number => !Number.isInteger(number) || number < 0 || number > 99);
    if (invalid !== -1) {
      lab.querySelector("[data-cpu-error]").textContent = `${invalid === 0 ? "10" : "11"}番地の数に、0〜99の整数を入力してください。実験中の値は変えていません。`;
      inputs[invalid].setAttribute("aria-invalid", "true");
      inputs[invalid].focus();
      return;
    }
    values = parsed;
    reset(`10番地に${values[0]}、11番地に${values[1]}を置きました。「次の段階へ」で最初から進められます。`);
  });
  lab.querySelector("[data-cpu-reset]").addEventListener("click", () => reset());
  reset();
  lab.hidden = false;
})();
