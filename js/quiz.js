(() => {
  "use strict";
  const quiz = document.querySelector("[data-quiz]");
  if (!quiz) return;
  const forms = [...quiz.querySelectorAll("form[data-answer]")];
  const summary = quiz.querySelector("[data-quiz-summary]");
  const saved = quiz.querySelector("[data-quiz-saved]");
  const reset = quiz.querySelector("[data-quiz-reset]");
  const lessonId = document.body.dataset.lessonId;
  const version = Number(quiz.dataset.quizVersion);
  const answered = new Map();
  const normalize = text => text.trim().normalize("NFKC").toUpperCase();

  function showSaved() {
    const previous = window.Riss.progress.get(lessonId).quiz;
    saved.textContent = previous && previous.version === version && previous.total === forms.length
      ? `直近の記録：${previous.correct} / ${previous.total}問正解` : "";
  }
  document.addEventListener("riss:progress", showSaved);
  showSaved();

  forms.forEach((form, index) => {
    let composing = false;
    const button = form.querySelector("button");
    const feedback = form.querySelector("[data-feedback]");
    form.addEventListener("compositionstart", () => { composing = true; });
    form.addEventListener("compositionend", () => { composing = false; });
    form.addEventListener("submit", event => {
      event.preventDefault();
      if (composing || answered.has(index)) return;
      const numeric = form.querySelector('input[type="text"]');
      const selected = form.querySelector('input[type="radio"]:checked');
      const value = numeric ? normalize(numeric.value) : selected?.value;
      if (!value || (numeric && !/^\d+$/.test(value))) {
        feedback.hidden = false;
        feedback.removeAttribute("data-correct");
        feedback.textContent = numeric ? "整数で答えを入力してください。" : "選択肢を1つ選んでください。";
        if (numeric) numeric.setAttribute("aria-invalid", "true");
        (numeric || form.querySelector("input")).focus();
        return;
      }
      if (numeric) numeric.removeAttribute("aria-invalid");
      const correct = numeric ? Number(value) === Number(form.dataset.answer) : value === form.dataset.answer;
      answered.set(index, correct);
      feedback.hidden = false;
      feedback.dataset.correct = String(correct);
      const label = document.createElement("strong");
      label.textContent = correct ? "✓ 正解です" : "もう一度、仕組みを確認しましょう";
      feedback.replaceChildren(label, document.createTextNode(form.dataset.explanation));
      form.querySelectorAll("input").forEach(input => { input.disabled = true; });
      // フォーカスを維持するため、判定後のボタンはaria-disabledにする。
      button.setAttribute("aria-disabled", "true");
      button.textContent = "回答済み";
      const count = [...answered.values()].filter(Boolean).length;
      summary.textContent = `${answered.size} / ${forms.length}問回答 · ${count}問正解`;
      if (answered.size === forms.length) {
        window.Riss.progress.saveQuiz(lessonId, { version, correct: count, total: forms.length });
        summary.textContent = `${count} / ${forms.length}問正解。解説を読んで、理解を確かめましょう。`;
      }
    });
    form.addEventListener("keydown", event => {
      if (event.key === "Enter" && (event.isComposing || composing)) event.preventDefault();
    });
    button.hidden = false;
  });
  reset.addEventListener("click", () => {
    answered.clear();
    forms.forEach(form => {
      form.querySelectorAll("input").forEach(input => { input.disabled = false; input.removeAttribute("aria-invalid"); });
      form.reset();
      const button = form.querySelector("button");
      button.removeAttribute("aria-disabled");
      button.textContent = "答え合わせ";
      form.querySelector("[data-feedback]").hidden = true;
    });
    summary.textContent = "答えをリセットしました。記録は4問すべて回答すると更新されます。";
    forms[0].querySelector("input").focus();
  });
  reset.hidden = false;
})();
