(() => {
  "use strict";
  // IDは保存データの識別に使うため、タイトルを変更しても維持する。
  const chapters = [
    ["数値と論理", ["進数・bit", "論理演算", "論理回路・フリップフロップ"]],
    ["コンピュータ", ["CPU・命令実行", "メモリ・キャッシュ", "入出力・割込み"]],
    ["OS", ["プロセス・スレッド", "スケジューリング", "仮想記憶"]],
    ["ネットワーク", ["LAN・MAC・ARP", "IPアドレス", "サブネット", "ルーティング", "TCP・UDP", "DNS・DHCP・Webアクセス"]],
    ["データベース", ["DB基礎・キー", "正規化", "トランザクション"]],
    ["アルゴリズム", ["データ構造", "探索・ソート"]],
    ["システム", ["性能", "信頼性"]],
    ["暗号", ["ハッシュ・MAC", "共通鍵暗号", "公開鍵暗号", "電子署名・PKI・TLS"]],
    ["Web・セキュリティ", ["HTTP・Cookie・Session", "Web攻撃"]],
    ["総合", ["A-1総合演習"]]
  ];
  const paths = { "01": "lessons/01-number-bit.html", "02": "lessons/02-logic.html", "03": "lessons/03-flipflop.html", "04": "lessons/04-cpu.html", "05": "lessons/05-memory-cache.html" };
  let number = 0;
  const lessons = chapters.flatMap(([chapterTitle, titles], index) => titles.map(title => {
    const id = String(++number).padStart(2, "0");
    return { id, title, chapter: String(index + 1).padStart(2, "0"), chapterTitle,
      path: paths[id] || null };
  }));
  window.Riss = { lessons, published: lessons.filter(lesson => lesson.path) };
})();
