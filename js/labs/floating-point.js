(() => {
  "use strict";
  const lab = document.querySelector("[data-fraction-lab]");
  if (!lab) return;
  // 値は「1/256が何個分か」の整数で持ち、表示用の小数は整数計算から作って誤差を出さない。
  const INITIAL = 160;
  let units = INITIAL;
  let width = 8;
  const buttons = [...lab.querySelectorAll("[data-bit-place]")];
  const widthButtons = [...lab.querySelectorAll("[data-width]")];
  const announce = lab.querySelector("[data-lab-status]");
  const reason = lab.querySelector("[data-lab-reason]");
  const weightOf = place => 2 ** (8 - place);

  // 1/256 = 0.00390625 なので、整数×390625 を10⁸で割れば正確な小数になる。
  function decimal(scaled, digits) {
    const text = String(scaled).padStart(digits + 1, "0");
    const fraction = text.slice(-digits).replace(/0+$/, "");
    return fraction ? `${text.slice(0, -digits)}.${fraction}` : text.slice(0, -digits);
  }
  const valueText = n => decimal(n * 390625, 8);
  // |n/256 − 1/10| = |10n − 256| / 2560 = |10n − 256| × 390625 / 10⁹
  const differenceText = n => decimal(Math.abs(10 * n - 256) * 390625, 9);
  const comparison = n => 10 * n > 256 ? "0.1より大きい" : "0.1より小さい";
  const binaryText = n => `0.${n.toString(2).padStart(8, "0").slice(0, width)}`;
  function nearest() {
    const step = weightOf(width);
    let best = 0;
    for (let n = 0; n < 256; n += step) {
      if (Math.abs(10 * n - 256) < Math.abs(10 * best - 256)) best = n;
    }
    return best;
  }
  function summary() {
    const note = units === nearest() ? `${width}bitで0.1に一番近い並びです。` : "";
    return `${binaryText(units)}₂（${valueText(units)}）は${comparison(units)}値で、差は${differenceText(units)}です。${note}`;
  }

  function render(message) {
    const active = [];
    buttons.forEach(button => {
      const place = Number(button.dataset.bitPlace);
      const used = place <= width;
      const on = (units & weightOf(place)) !== 0;
      button.textContent = used ? (on ? "1" : "0") : "−";
      button.disabled = !used;
      button.setAttribute("aria-pressed", String(on));
      button.parentElement.classList.toggle("is-on", on);
      if (on) active.push(valueText(weightOf(place)));
    });
    widthButtons.forEach(button => button.setAttribute("aria-pressed", String(Number(button.dataset.width) === width)));
    lab.querySelector("[data-lower-group]").classList.toggle("is-unused", width === 4);
    lab.querySelector("[data-lower-label]").textContent = width === 4 ? "小数第5〜8位（4bitでは使わない）" : "小数第5〜8位";
    lab.querySelector("[data-equation]").textContent = `${active.length ? active.join(" + ") : "0"} = ${valueText(units)}`;
    lab.querySelector("[data-binary-label]").textContent = `2進数 · 小数点の右${width}桁`;
    lab.querySelector("[data-binary]").textContent = binaryText(units);
    lab.querySelector("[data-decimal]").textContent = valueText(units);
    lab.querySelector("[data-difference]").textContent = differenceText(units);
    if (message) announce.textContent = `${message}。${summary()}`;
  }

  buttons.forEach(button => button.addEventListener("click", () => {
    const place = Number(button.dataset.bitPlace);
    const weight = weightOf(place);
    const on = (units & weight) === 0;
    units ^= weight;
    render(`小数第${place}位のbitを${on ? "1" : "0"}にしました`);
    reason.textContent = `小数第${place}位（重み1/${2 ** place} = ${valueText(weight)}）のbitを${on ? "1" : "0"}にしたので、値が${valueText(weight)}${on ? "増え" : "減り"}ました。${summary()}`;
  }));
  widthButtons.forEach(button => button.addEventListener("click", () => {
    const next = Number(button.dataset.width);
    if (next === width) return;
    width = next;
    // 4bitにしたときは、使わない小数第5〜8位を0にする。
    if (width === 4) units &= 0xF0;
    render(`小数点の右を${width}bitにしました`);
    reason.textContent = width === 4
      ? `小数第5〜8位を0にして、小数点の右を4bitにしました。${summary()}`
      : `小数第5〜8位も使えるようになりました。細かい重みを足して、差を小さくできるか試しましょう。${summary()}`;
  }));
  lab.querySelector("[data-lab-nearest]").addEventListener("click", () => {
    units = nearest();
    render(`${width}bitで一番近い並びにしました`);
    reason.textContent = width === 4
      ? `4bitで0.1に一番近いのは${binaryText(units)}₂（${valueText(units)}）で、差は${differenceText(units)}です。8bitに増やすと、差を小さくできます。`
      : `8bitで0.1に一番近いのは${binaryText(units)}₂（${valueText(units)}）で、差は${differenceText(units)}です。bitを増やしても、0.1にぴったり一致する並びはありません。`;
  });
  lab.querySelector("[data-lab-reset]").addEventListener("click", () => {
    units = INITIAL;
    width = 8;
    render("例の0.625に戻しました");
    reason.textContent = `最初の例に戻しました。${summary()}`;
  });
  render();
  reason.textContent = `最初の例です。${summary()}`;
  lab.hidden = false;
})();
