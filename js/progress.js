(() => {
  "use strict";
  const key = "riss.a1.progress.v1";
  const empty = () => ({ version: 1, lessons: {}, lastViewed: null });
  let state = empty();
  let persistent = true;
  let storageMessage = "";
  const known = id => window.Riss.published.some(lesson => lesson.id === id);

  function read() {
    if (!persistent) return;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) { state = empty(); return; }
      const data = JSON.parse(raw);
      if (!data || data.version !== 1 || !data.lessons || typeof data.lessons !== "object" || Array.isArray(data.lessons)) {
        throw new Error("Invalid progress format");
      }
      const clean = empty();
      for (const lesson of window.Riss.published) {
        const entry = data.lessons[lesson.id];
        if (!entry || typeof entry !== "object") continue;
        const item = { visited: entry.visited === true, completed: entry.completed === true };
        const quiz = entry.quiz;
        if (quiz && Number.isInteger(quiz.version) && quiz.version > 0 && Number.isInteger(quiz.total) && quiz.total > 0 && Number.isInteger(quiz.correct) && quiz.correct >= 0 && quiz.correct <= quiz.total) {
          item.quiz = { version: quiz.version, total: quiz.total, correct: quiz.correct };
        }
        clean.lessons[lesson.id] = item;
      }
      clean.lastViewed = known(data.lastViewed) ? data.lastViewed : null;
      state = clean;
    } catch {
      persistent = false;
      storageMessage = "進捗を読み込めません。この画面では学習を続けられますが、進捗は保存されません。";
    }
  }

  function update(id, changes, viewed = false) {
    if (!known(id)) return;
    // 書き込み前に読み直し、別タブで保存された他の情報を保つ。
    read();
    state.lessons[id] = { ...state.lessons[id], ...changes };
    if (viewed) state.lastViewed = id;
    if (persistent) {
      try { localStorage.setItem(key, JSON.stringify(state)); }
      catch {
        persistent = false;
        storageMessage = "この環境では進捗を保存できません。学習は続けられますが、画面を閉じると今回の記録は失われます。";
      }
    }
    document.dispatchEvent(new Event("riss:progress"));
  }

  read();
  window.Riss.progress = {
    get: id => state.lessons[id] || {},
    get lastViewed() { return state.lastViewed; },
    get persistent() { return persistent; },
    get message() { return storageMessage; },
    visit: id => update(id, { visited: true }, true),
    complete: (id, completed) => update(id, { completed }),
    saveQuiz: (id, quiz) => update(id, { quiz })
  };
  window.addEventListener("storage", event => {
    if (event.key === key || event.key === null) {
      read();
      document.dispatchEvent(new Event("riss:progress"));
    }
  });
})();
