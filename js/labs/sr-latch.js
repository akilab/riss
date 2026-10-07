(() => {
  "use strict";
  const lab = document.querySelector("[data-sr-lab]");
  if (!lab) return;
  // NOR型。出力は整定後を表示し、禁止入力の同時解除は確定させない。
  let mode = "hold";
  let q = 0;
  const inputs = { set: [1, 0], hold: [0, 0], reset: [0, 1], forbidden: [1, 1] };
  const show = value => value === null ? "?" : String(value);

  function render(initial = false) {
    const [s, r] = inputs[mode];
    const qb = mode === "forbidden" ? 0 : q === null ? null : 1 - q;
    const topOr = q === null ? null : 1 - q;
    const bottomOr = qb === null ? null : 1 - qb;
    const values = { s, r, q, qb, topOr, bottomOr, topFeedback: qb, bottomFeedback: q };
    const labels = { s: "S=", r: "R=", q: "Q=", qb: "Q̅=" };
    lab.querySelectorAll("[data-sr-value]").forEach(element => {
      const name = element.dataset.srValue;
      element.textContent = (labels[name] || "") + show(values[name]);
    });
    lab.querySelectorAll("[data-sr-wire]").forEach(element => {
      element.dataset.signal = show(values[element.dataset.srWire]);
    });
    lab.querySelectorAll("[data-sr-mode]").forEach(button => {
      button.setAttribute("aria-pressed", String(button.dataset.srMode === mode));
    });
    const messages = {
      set: "1を書き込みました。S=1が下の出力を0にし、その0を上へ戻すとQ=1になります。",
      reset: "0を書き込みました。R=1が上の出力Qを0にし、その0を下へ戻すとQバー=1になります。",
      hold: q === null ? "保持する値は保証できません。禁止入力を同時に解除したので、1または0を書き込んで値を確定してください。" : `入力を両方0にしても、Q=${q}が残ります。相手から戻ってくる出力が、今の値を保っています。`,
      forbidden: "禁止入力です。上下ともOR=1、NOTの後は0になり、QとQバーが反対の値になりません。両入力の同時解除後の値は保証できません。"
    };
    const reason = initial ? "実験の初期状態はQ=0、Qバー=1です。「1を書き込む」→「入力を0に戻す」を試しましょう。" : messages[mode];
    const result = `S=${s}、R=${r} → Q=${show(q)}、Q̅=${show(qb)}${mode === "forbidden" ? "（禁止入力）" : q === null ? "（不定）" : mode === "hold" ? "（保持）" : ""}`;
    lab.querySelector("[data-sr-result]").textContent = result;
    lab.querySelector("[data-sr-reason]").textContent = reason;
    lab.querySelector("[data-sr-status]").textContent = `${result}。${reason}`;
    lab.querySelector("[data-sr-desc]").textContent = `${result}。${reason} 上段はRとQバー、下段はSとQをORし、NOTで反転します。`;
    let lines;
    const top = `上段：R=${r} OR Qバー=${show(qb)} → ${show(topOr)}。NOT → Q=${show(q)}。`;
    const bottom = `下段：S=${s} OR Q=${show(q)} → ${show(bottomOr)}。NOT → Qバー=${show(qb)}。`;
    if (q === null) {
      lines = ["両入力0だけでは、Q=0・Qバー=1と、Q=1・Qバー=0のどちらも成り立ちます。", "禁止入力からの同時解除では、実際の微小な遅延で結果が変わります。", "このLabでは勝手に0や1を選ばず「?」と表示します。"];
    } else if (mode === "forbidden") {
      lines = [top, bottom, "両方の出力が0。通常の1bitの保持状態として使えません。"];
    } else {
      // 書込みで先に出力が確定する側から説明。保持では戻る1を先に追う。
      const bottomFirst = mode === "set" || (mode === "hold" && q === 1);
      lines = [bottomFirst ? bottom : top, bottomFirst ? top : bottom,
        mode === "hold" ? `Q=${q}が相手へ戻り、Qバー=${qb}も戻るため、同じ計算結果が続きます。` : "出力を相手に戻しても結果は変わらず、この状態で落ち着きます。"];
    }
    const list = lab.querySelector("[data-sr-calculations]");
    list.replaceChildren(...lines.map(line => {
      const item = document.createElement("li");
      item.textContent = line;
      return item;
    }));
  }

  lab.querySelectorAll("[data-sr-mode]").forEach(button => {
    button.addEventListener("click", () => {
      const previous = mode;
      mode = button.dataset.srMode;
      if (mode === "set") q = 1;
      else if (mode === "reset" || mode === "forbidden") q = 0;
      else if (previous === "forbidden") q = null;
      render();
    });
  });
  lab.querySelector("[data-sr-initial]").addEventListener("click", () => {
    mode = "hold";
    q = 0;
    render(true);
  });
  render(true);
  lab.hidden = false;
})();
