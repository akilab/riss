(() => {
  "use strict";
  const { lessons, published, progress } = window.Riss;
  const lessonId = document.body.dataset.lessonId;
  const statusOf = id => {
    const entry = progress.get(id);
    return entry.completed ? ["completed", "✓ 完了"] : entry.visited ? ["visited", "学習中"] : ["new", "未学習"];
  };

  function render() {
    document.querySelectorAll("[data-lesson-status]").forEach(element => {
      const [status, label] = statusOf(element.dataset.lessonStatus);
      element.dataset.state = status;
      element.textContent = label;
    });
    const completed = published.filter(lesson => progress.get(lesson.id).completed).length;
    const count = document.querySelector("[data-progress-count]");
    if (count) count.textContent = completed;
    const bar = document.querySelector("[data-progress-bar]");
    if (bar) {
      bar.max = published.length;
      bar.value = completed;
      bar.setAttribute("aria-label", `公開済み${published.length}ページ中${completed}ページ完了`);
    }
    document.querySelectorAll("[data-chapter-summary]").forEach(element => {
      const chapterLessons = lessons.filter(lesson => lesson.chapter === element.dataset.chapterSummary);
      const available = chapterLessons.filter(lesson => lesson.path);
      const done = available.filter(lesson => progress.get(lesson.id).completed).length;
      element.textContent = `${chapterLessons.length}ページ予定 · 公開 ${available.length} · 完了 ${done}`;
    });
    const resume = document.querySelector("[data-resume]");
    if (resume) {
      const last = published.find(lesson => lesson.id === progress.lastViewed);
      resume.href = last ? last.path : published[0].path;
      resume.textContent = last ? `学習を再開する：${last.title}` : "Lesson 01から学習を始める";
    }
    const complete = document.querySelector("[data-complete]");
    if (complete) {
      complete.textContent = progress.get(lessonId).completed ? "未完了に戻す" : "この教材を学習完了にする";
      complete.classList.toggle("secondary", !!progress.get(lessonId).completed);
      const message = document.querySelector("[data-completion-message]");
      message.textContent = progress.get(lessonId).completed ? (progress.persistent ? "✓ 学習完了を保存しました。いつでも復習できます。" : "✓ この画面で学習完了にしました。進捗は保存されません。") : "";
    }
    document.querySelectorAll("[data-storage-notice]").forEach(element => {
      element.hidden = progress.persistent;
      element.textContent = progress.message;
    });
  }

  document.addEventListener("riss:progress", render);
  const complete = document.querySelector("[data-complete]");
  if (complete) {
    complete.addEventListener("click", () => progress.complete(lessonId, !progress.get(lessonId).completed));
    complete.hidden = false;
  }
  if (lessonId) progress.visit(lessonId);
  render();
})();
