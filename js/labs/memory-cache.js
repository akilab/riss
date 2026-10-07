(() => {
  "use strict";
  const lab = document.querySelector("[data-cache-lab]");
  if (!lab) return;
  // 教育用：固定の3番地、2枠のキャッシュ、読出しのみ。時間は架空の単位。
  const memory = { 10: 12, 11: 7, 12: 19 };
  let slots, reads, hits, elapsed;

  function render(address, hit, replaced) {
    const hasRead = address !== undefined;
    lab.querySelectorAll("[data-cache-slot]").forEach(element => {
      const item = slots[Number(element.dataset.cacheSlot)];
      element.textContent = item ? `${item.address}番地のコピー` : "空き";
    });
    lab.querySelectorAll("[data-cache-slot-value]").forEach(element => {
      const item = slots[Number(element.dataset.cacheSlotValue)];
      element.textContent = item ? `中身：数${memory[item.address]}` : "コピーなし";
    });
    lab.querySelectorAll("[data-cache-table-slot]").forEach(row => {
      const item = slots[Number(row.dataset.cacheTableSlot)];
      row.querySelector("[data-cache-place]").textContent = item ? `${item.address}番地のコピー` : "空き";
      row.querySelector("[data-cache-number]").textContent = item ? String(memory[item.address]) : "—";
      row.classList.toggle("cache-current", hasRead && item?.address === address);
    });
    lab.querySelector("[data-cache-cpu-number]").textContent = hasRead ? `受け取った数：${memory[address]}` : "まだ数を読んでいません";
    lab.querySelector('[data-cache-route="cache"]').classList.toggle("cache-route-active", hasRead);
    lab.querySelector('[data-cache-route="memory"]').classList.toggle("cache-route-active", hasRead && !hit);
    const label = !hasRead ? "キャッシュは空です。最初に10番地の数を読んでみましょう。" :
      `${hit ? "ヒット：コピーがありました" : "ミス：コピーがありませんでした"}。${address}番地の中身の数${memory[address]}をCPUへ。`;
    const reason = !hasRead ? "「10番地の数を読む」などの3つのボタンで、読む箱の場所を選びます。番地の番号と、中身の数は別のものです。" : hit ?
      "キャッシュのコピーから読めたので、今回は主記憶へ読みに行きません。使ったコピーを、そのままキャッシュに残します。" :
      `主記憶の${address}番地から数${memory[address]}を読み、コピーしました。${replaced === null ? "空き枠を使いました。" : `最後に読んだのが最も古い${replaced}番地のコピーを入れ替えました。` }主記憶の元の数は消えません。`;
    lab.querySelector("[data-cache-result]").textContent = label;
    lab.querySelector("[data-cache-reason]").textContent = reason;
    lab.querySelector("[data-cache-time]").textContent = !hasRead ? "今回の待ち時間：まだ計測していません" :
      `今回の待ち時間：${hit ? "1単位（コピーの確認・読出し）" : "10単位（キャッシュ1 ＋ 主記憶9）"}`;
    lab.querySelector("[data-cache-counts]").textContent = `読出し${reads}回 · ヒット${hits}回 · ミス${reads - hits}回`;
    lab.querySelector("[data-cache-total]").textContent = `累計待ち時間：${elapsed}単位 ／ キャッシュなしなら${reads * 9}単位`;
    document.querySelector("[data-cache-stats]").textContent = reads ?
      `ヒット率：${hits} ÷ ${reads} × 100 = ${(hits / reads * 100).toFixed(1)}% ／ 1回の平均待ち時間：${elapsed} ÷ ${reads} = ${(elapsed / reads).toFixed(1)}単位` : "まだ読出しがないため、割合と平均は計算していません。";
    lab.querySelector("[data-cache-status]").textContent = `${label} ${reason} ${lab.querySelector("[data-cache-time]").textContent}`;
    lab.querySelector("[data-cache-desc]").textContent = `${label} ${reason} キャッシュの内容は表でも読めます。`;
  }

  lab.querySelectorAll("[data-cache-read]").forEach(button => {
    button.addEventListener("click", () => {
      const address = Number(button.dataset.cacheRead);
      reads++;
      const found = slots.findIndex(item => item?.address === address);
      const hit = found !== -1;
      let replaced = null;
      if (hit) {
        hits++;
        slots[found].used = reads;
      } else {
        let index = slots.findIndex(item => item === null);
        if (index === -1) index = slots[0].used < slots[1].used ? 0 : 1;
        replaced = slots[index]?.address ?? null;
        slots[index] = { address, used: reads };
      }
      elapsed += hit ? 1 : 10;
      render(address, hit, replaced);
    });
  });
  function reset() {
    slots = [null, null];
    reads = hits = elapsed = 0;
    render();
  }
  lab.querySelector("[data-cache-reset]").addEventListener("click", reset);
  reset();
  lab.hidden = false;
})();
