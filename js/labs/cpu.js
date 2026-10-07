(() => {
  "use strict";
  const lab = document.querySelector("[data-cpu-lab]");
  if (!lab) return;
  // 教育用の命令。各命令を1アドレスに置き、3段階で実行する。
  const program = [
    { op: "LOAD", address: 10, text: "LOAD 10" },
    { op: "ADD", address: 11, text: "ADD 11" },
    { op: "STORE", address: 12, text: "STORE 12" },
    { op: "HALT", text: "HALT" }
  ];
  const stageNames = { fetch: "取り出す", decode: "読み解く", execute: "実行する" };
  const numberA = lab.querySelector("#cpu-number-a");
  const numberB = lab.querySelector("#cpu-number-b");
  const next = lab.querySelector("[data-cpu-next]");
  let values = [12, 7];
  let state;

  function reset(message) {
    state = { pc: 0, ir: null, acc: 0, output: null, completed: 0, steps: 0,
      next: "fetch", stage: null, current: null, halted: false };
    numberA.value = String(values[0]);
    numberB.value = String(values[1]);
    clearErrors();
    render(message || "まず命令を取り出しましょう。PCは00、計算用レジスタACCは0です。", []);
  }

  function clearErrors() {
    lab.querySelector("[data-cpu-error]").textContent = "";
    for (const input of [numberA, numberB]) input.removeAttribute("aria-invalid");
  }

  function render(message, active) {
    const pc = String(state.pc).padStart(2, "0");
    lab.querySelector("[data-cpu-pc]").textContent = `${pc}番地`;
    const actions = { LOAD: "IR：読む", ADD: "IR：足す", STORE: "IR：保存", HALT: "IR：停止" };
    lab.querySelector("[data-cpu-ir-action]").textContent = state.ir ? actions[state.ir.op] : "指示 IR";
    lab.querySelector("[data-cpu-ir]").textContent = state.ir ? state.ir.address === undefined ? "—" : `${state.ir.address}番地` : "未取得";
    lab.querySelector("[data-cpu-acc]").textContent = String(state.acc);
    lab.querySelector("[data-cpu-memory-values]").textContent = `10番地［数${values[0]}］　11番地［数${values[1]}］`;
    lab.querySelector('[data-cpu-instruction="LOAD"]').textContent = `10番地の数${values[0]}を読む`;
    lab.querySelector('[data-cpu-instruction="ADD"]').textContent = `11番地の数${values[1]}を足す`;
    lab.querySelector("[data-cpu-output]").textContent = state.output === null ? "未保存" : String(state.output);
    lab.querySelector("[data-cpu-acc-result]").textContent = String(state.acc);
    lab.querySelector("[data-cpu-active-values]").textContent = `実験中の値：${values[0]} + ${values[1]}`;
    lab.querySelector("[data-cpu-result]").textContent = state.halted ? `停止しました。結果${state.output}は主記憶の12番地に保存されています。` : `${state.steps}段階進みました。次は「${stageNames[state.next]}」です。`;
    lab.querySelector("[data-cpu-reason]").textContent = message;
    lab.querySelector("[data-cpu-status]").textContent = `${message} 次の場所PCは${pc}番地、ACC内の数は${state.acc}。`;
    lab.querySelector("[data-cpu-desc]").textContent = `次の場所PCは${pc}番地、ACC内の数は${state.acc}。${message}`;
    next.disabled = state.halted;
    next.textContent = state.halted ? "プログラムは停止しました" : `次の段階へ：${stageNames[state.next]}`;
    lab.querySelectorAll("[data-cpu-phase]").forEach(element => {
      if (element.dataset.cpuPhase === state.stage) element.setAttribute("aria-current", "step");
      else element.removeAttribute("aria-current");
    });
    lab.querySelectorAll("[data-cpu-node]").forEach(element => {
      element.classList.toggle("cpu-active", active.includes(element.dataset.cpuNode));
    });
    lab.querySelectorAll("[data-program-address]").forEach(row => {
      const address = Number(row.dataset.programAddress);
      const current = address === state.current;
      row.classList.toggle("cpu-current-row", current);
      row.querySelector("[data-program-state]").textContent = address < state.completed ? "実行済み" : current ? "処理中" : address === state.pc ? "次の読出し" : "—";
    });
    lab.querySelector('[data-memory-address="10"]').textContent = String(values[0]);
    lab.querySelector('[data-memory-address="11"]').textContent = String(values[1]);
    lab.querySelector('[data-memory-address="12"]').textContent = state.output === null ? "未保存" : String(state.output);
  }

  next.addEventListener("click", () => {
    if (state.halted) return;
    const phase = state.next;
    state.stage = phase;
    state.steps++;
    if (phase === "fetch") {
      state.current = state.pc;
      state.ir = program[state.pc];
      state.pc++;
      state.next = "decode";
      const instruction = lab.querySelector(`[data-cpu-instruction="${state.ir.op}"]`).textContent;
      render(`${String(state.current).padStart(2, "0")}番地から「${instruction}」という指示をIRへ読みました。PCは次の${String(state.pc).padStart(2, "0")}番地へ。計算はまだです。`, ["memory", "pc", "ir"]);
    } else if (phase === "decode") {
      state.next = "execute";
      const descriptions = {
        LOAD: `10番地の箱から数${values[0]}をACCへ読む指示です。10は場所、${values[0]}は中身の数です。`,
        ADD: `11番地の箱の数${values[1]}を、ACCの数に足す指示です。11は足す数ではなく場所です。`,
        STORE: `ACCの数${state.acc}を12番地の箱へ書く指示です。12は保存先、${state.acc}は保存する数です。`,
        HALT: "プログラムを停止する命令です。"
      };
      render(`${descriptions[state.ir.op]} まだ読み解いた段階なので、数は変わりません。`, ["ir", "control"]);
    } else {
      state.completed++;
      state.next = "fetch";
      const op = state.ir.op;
      if (op === "LOAD") {
        state.acc = values[0];
        render(`10番地の箱 → 中身の数${values[0]}をACCへ読みました。箱の番号10ではなく、中身の${values[0]}がACCに入ります。`, ["memory", "acc", "control"]);
      } else if (op === "ADD") {
        const previous = state.acc;
        state.acc += values[1];
        render(`11番地の箱から数${values[1]}を読み、ACCの数${previous}に足しました。${previous} + ${values[1]} = ${state.acc}。結果はACC内にあり、箱への保存はまだです。`, ["memory", "alu", "acc", "control"]);
      } else if (op === "STORE") {
        state.output = state.acc;
        render(`ACC内の数${state.acc} → 12番地の箱へ保存しました。保存先の番号は12、中に入れる数は${state.acc}です。ACCにも同じ数が残ります。`, ["acc", "memory", "control"]);
      } else {
        state.halted = true;
        render("停止する指示を実行しました。箱に保存した数とACC内の数は、そのまま残ります。", ["control"]);
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
      lab.querySelector("[data-cpu-error]").textContent = `数${invalid === 0 ? "A" : "B"}に0〜99の整数を入力してください。実験中の値は変更していません。`;
      inputs[invalid].setAttribute("aria-invalid", "true");
      inputs[invalid].focus();
      return;
    }
    values = parsed;
    reset(`数A=${values[0]}、数B=${values[1]}を主記憶に置きました。プログラムを最初から進められます。`);
  });
  lab.querySelector("[data-cpu-reset]").addEventListener("click", () => reset("実験中の値を保ち、PC・IR・ACC・保存結果を初期状態へ戻しました。"));
  reset();
  lab.hidden = false;
})();
