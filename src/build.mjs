import { readFile, writeFile, readdir, mkdir, cp } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const categories = ['程式基礎', '電路觀念', '學習方法'];
const headings = ['核心概念', '動手看範例', '常見誤區', '自我檢核'];
export const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const assert = (v, m) => { if (!v) throw new Error(m); };
export async function loadNotes() {
  const files = (await readdir(path.join(root, 'content/notes'))).filter(f => f.endsWith('.json')).sort();
  const notes = []; const seen = new Set();
  for (const file of files) {
    const n = JSON.parse(await readFile(path.join(root,'content/notes',file),'utf8'));
    const fail = msg => `${file}: ${msg}`;
    assert(/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(n.slug) && file === `${n.slug}.json` && !seen.has(n.slug), fail('slug 或檔名不合法／重複'));
    seen.add(n.slug);
    assert(typeof n.title === 'string' && n.title.length > 0 && n.title.length <= 40,fail('標題須為 1–40 字'));
    assert(categories.includes(n.category),fail('分類無效'));
    assert(typeof n.summary === 'string' && n.summary.length >= 20 && n.summary.length <= 100,fail('摘要須為 20–100 字'));
    assert(Number.isInteger(n.minutes) && n.minutes >= 1 && n.minutes <= 20,fail('閱讀時間無效'));
    assert(/^\d{4}-\d{2}-\d{2}$/.test(n.updated) && new Date(n.updated).toISOString().slice(0,10) === n.updated,fail('日期無效'));
    assert(Array.isArray(n.tags) && n.tags.length >= 1 && n.tags.length <= 5 && n.tags.every(t => typeof t === 'string' && t.trim()), fail('tags 無效'));
    assert(Array.isArray(n.sections) && n.sections.length === 4,fail('必須有四節'));
    n.sections.forEach((s,i) => {
      assert(s.heading === headings[i] && Array.isArray(s.paragraphs) && s.paragraphs.length && s.paragraphs.every(p => typeof p === 'string' && p.trim()),fail(`章節 ${i+1} 無效`));
      assert(s.code === undefined || typeof s.code === 'string',fail('code 必須是純文字'));
      assert(s.bullets === undefined || (Array.isArray(s.bullets) && s.bullets.every(b => typeof b === 'string' && b.trim())),fail('bullets 無效'));
    });
    assert(Array.isArray(n.sources) && n.sources.length && n.sources.every(s => typeof s.title === 'string' && s.title.trim() && new URL(s.url).protocol === 'https:'),fail('來源必須有標題及 HTTPS 網址'));
    notes.push(n);
  }
  assert(notes.length > 0,'至少需要一篇筆記');
  return notes;
}
const color = category => ['mint','amber','lilac'][categories.indexOf(category)];
const arrow = '<span aria-hidden="true">↗</span>';
function layout(title, body, {nested=false, active='notes', description='把學過的，變成用得上的。給資電初學者的六篇概念筆記。'}={}) {
 const base = nested ? '../' : './';
 return `<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="${esc(description)}"><meta name="theme-color" content="#174f46"><title>${esc(title)}｜課間筆記</title><link rel="icon" href="${base}assets/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="${base}assets/styles.css"><script src="${base}assets/app.js" defer></script></head><body><a class="skip" href="#main">跳至主要內容</a><header class="site-header wrap"><a class="brand" href="${base}index.html"><span class="brand-mark" aria-hidden="true">k<span> /</span></span><span>課間筆記<small>KEJIAN NOTES</small></span></a><nav aria-label="主要導覽"><a ${active==='notes'?'aria-current="page"':''} href="${base}index.html#notes">筆記總覽</a><a ${active==='about'?'aria-current="page"':''} href="${base}about.html">關於專案 ${arrow}</a></nav></header>${body}<footer class="site-footer wrap"><a class="brand-name" href="${base}index.html">課間筆記<span>把理解，一篇篇留下。</span></a><div>劉譯棋 製作 · 2026<br><a href="${base}about.html">專案說明</a><span aria-hidden="true"> / </span><a href="${base}AGENTS.md" download>下載 AGENTS.md ${arrow}</a></div></footer></body></html>`;
}
function card(n, i) {return `<article class="note-card" data-note data-category="${esc(n.category)}" data-search="${esc([n.title,n.summary,...n.tags,n.category].join(' ').toLowerCase())}" data-slug="${n.slug}"><div class="card-meta"><span class="tag ${color(n.category)}">${esc(n.category)}</span><span class="read-badge" data-read-badge="${n.slug}"></span><span class="card-number">${String(i+1).padStart(2,'0')}</span></div><h3><a href="./notes/${n.slug}.html">${esc(n.title)} ${arrow}</a></h3><p>${esc(n.summary)}</p><div class="card-bottom"><span>${n.tags.map(t=>esc(t)).join(' · ')}</span><span>${n.minutes} 分鐘</span></div></article>`;}
export async function build() {
 const notes = await loadNotes(); const dist = path.join(root,'dist');
 await mkdir(path.join(dist,'notes'),{recursive:true});
 // Remove only stale generated article files, within the verified dist/notes directory.
 const { unlink } = await import('node:fs/promises');
 for(const file of await readdir(path.join(dist,'notes'))) if(file.endsWith('.html') && !notes.some(n=>`${n.slug}.html`===file)) await unlink(path.join(dist,'notes',file));
 await cp(path.join(root,'src/assets'),path.join(dist,'assets'),{recursive:true});
 await cp(path.join(root,'AGENTS.md'),path.join(dist,'AGENTS.md'));
 const featured = notes.find(n=>n.slug==='binary-search') || notes[0];
 const home = `<main id="main"><section class="hero wrap"><div class="hero-copy"><p class="eyebrow"><span></span> 給每個正在學習的你</p><h1>把學過的，<br>變成<span class="underlined">用得上的。</span></h1><p class="hero-description">程式、電路，還有學習的方法。<br>把複雜的觀念拆小，留下一次就能回看的理解。</p><a class="primary-button" href="#notes">翻開筆記 <span aria-hidden="true">↓</span></a><div class="hero-stats"><span><strong>${String(notes.length).padStart(2,'0')}</strong> 篇概念筆記</span><span><strong>03</strong> 個學習主題</span><span class="small-note">慢慢學，也能走很遠。</span></div></div><a class="featured" href="./notes/${featured.slug}.html"><div class="featured-top"><span>本週精選 / ALGORITHM</span><span aria-hidden="true">✳</span></div><div class="algorithm-art" aria-hidden="true"><div class="art-label">BINARY SEARCH</div><div class="number-row"><span>03</span><span>07</span><span class="middle">12</span><span class="target">18</span><span>25</span></div><div class="bracket"><span>排除一半</span><span>縮小範圍 →</span></div><div class="art-formula">n → n/2 → n/4 → …</div></div><div class="featured-bottom"><span class="feature-kicker">一個概念，一次搞懂</span><h2>二分搜尋：<br>每次排除一半可能 <span aria-hidden="true">↗</span></h2><p>先排序，再縮小。用 ${featured.minutes} 分鐘掌握邊界。</p></div><span class="note-sticker">LESS, BUT<br>UNDERSTOOD.</span></a></section><section class="notes-section wrap" id="notes"><div class="section-heading"><div><p class="eyebrow">THE NOTEBOOK</p><h2>從一個好問題開始</h2></div><p>不求一次讀完，先找到今天想懂的事。</p></div><div class="filter-bar"><div class="filters" role="group" aria-label="依主題篩選"><button type="button" data-filter="全部" aria-pressed="true">全部筆記 <span>${notes.length}</span></button>${categories.map(c=>`<button type="button" data-filter="${c}" aria-pressed="false">${c}</button>`).join('')}</div><div class="search"><label for="search">搜尋筆記</label><span aria-hidden="true">⌕</span><input id="search" type="search" placeholder="搜尋觀念、關鍵字…" autocomplete="off"></div></div><div class="result-line"><p id="result-count" role="status" aria-live="polite">共 ${notes.length} 篇筆記</p><button class="text-button" id="clear-filters" type="button" hidden>清除條件 ×</button></div><div class="note-grid">${notes.map(card).join('')}</div><div class="empty-state" id="empty-state" hidden><span aria-hidden="true">⌕</span><h3>這一頁，還沒有筆記。</h3><p>試試其他關鍵字，或清除條件重新找找。</p></div><noscript><p class="notice">JavaScript 未啟用，仍可閱讀全部筆記；搜尋與閱讀標記需啟用 JavaScript。</p></noscript></section><section class="closing wrap"><div class="closing-symbol" aria-hidden="true">✳</div><div><p class="eyebrow">BUILD A LITTLE, LEARN A LOT</p><h2>不只收藏答案，也留下一套方法。</h2><p>內容遵循同一份規則，下一篇筆記也能接著長出來。</p></div><a href="./about.html">看看這個專案怎麼運作 ${arrow}</a></section></main>`;
 await writeFile(path.join(dist,'index.html'),layout('把理解，一篇篇留下',home));
 for(const n of notes) {
  const body = `<main class="wrap article-main" id="main"><a class="back-link" href="../index.html#notes">← 回到筆記總覽</a><div class="article-grid"><article><header class="article-heading"><span class="tag ${color(n.category)}">${esc(n.category)}</span><h1>${esc(n.title)}</h1><p class="article-summary">${esc(n.summary)}</p><div class="article-meta"><span>更新 ${n.updated} · 約 ${n.minutes} 分鐘</span><button type="button" class="read-toggle" data-read-toggle="${n.slug}" aria-pressed="false">標記已讀 ✓</button></div><p class="storage-status" role="status"></p></header>${n.sections.map((s,i)=>`<section class="article-section" id="section-${i+1}"><span class="section-number">0${i+1}</span><h2>${esc(s.heading)}</h2>${s.paragraphs.map(p=>`<p>${esc(p)}</p>`).join('')}${s.code?`<div class="code-label">EXAMPLE / 範例</div><pre><code>${esc(s.code)}</code></pre>`:''}${s.bullets?`<ul>${s.bullets.map(b=>`<li>${esc(b)}</li>`).join('')}</ul>`:''}</section>`).join('')}<section class="sources" id="sources"><h2>參考資料</h2><ul>${n.sources.map(s=>`<li><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title)} ${arrow}</a></li>`).join('')}</ul><p>內容以中文重新整理，範例為教學示例；需要細節時，回到原始文件查核。</p></section><section class="related"><p class="eyebrow">KEEP LEARNING</p><h2>下一個小問題</h2>${notes.filter(x=>x.slug!==n.slug).sort((a,b)=>(b.category===n.category)-(a.category===n.category)).slice(0,2).map(x=>`<a href="./${x.slug}.html"><span>${esc(x.title)}</span>${arrow}</a>`).join('')}</section></article><aside class="toc"><p class="eyebrow">這篇筆記的路線</p><nav aria-label="文章目錄">${n.sections.map((s,i)=>`<a href="#section-${i+1}"><span>0${i+1}</span>${esc(s.heading)}</a>`).join('')}<a href="#sources"><span>↗</span>參考資料</a></nav><div class="toc-note">不急著記住全部。<br>能用自己的話說一次，<br>就是理解的開始。</div></aside></div></main>`;
  await writeFile(path.join(dist,'notes',`${n.slug}.html`),layout(n.title,body,{nested:true,description:n.summary}));
 }
 const about = `<main class="wrap about-main" id="main"><p class="eyebrow">ABOUT THE PROJECT</p><h1>讓筆記有秩序，<br>讓理解能累積。</h1><p class="about-lead">「課間筆記」是一個給資電初學者的學習知識庫，也是一次把 AI 協作規則變成可持續專案的練習。</p><div class="about-grid"><section><h2>這裡放了什麼？</h2><p>目前共有 ${notes.length} 篇原創整理，涵蓋程式基礎、電路觀念與學習方法。每篇都以相同的四節結構說明一個問題，附上範例、檢核答案與來源。</p><p>首頁可搜尋標題、摘要及標籤，並依主題篩選。閱讀標記只存在你的瀏覽器，不會上傳；清除瀏覽資料也會清除標記。</p><h2>規則與內容，分開維護</h2><p>AGENTS.md 記錄專案目的、檔案結構、資料契約、視覺風格、AI 修改流程與驗收條件。內容放在 JSON，版面由同一個生成器產生，避免每新增一篇就重寫一套網頁。</p><a class="primary-button" href="./AGENTS.md" download>下載完整 AGENTS.md ${arrow}</a></section><section class="workflow"><p class="eyebrow">HOW IT GROWS</p><h2>下一篇，沿著規則繼續。</h2><ol><li><strong>讀規則</strong><span>先讀 AGENTS.md，確認分類、格式與限制。</span></li><li><strong>寫內容</strong><span>複製 JSON 範本，填上四節、範例與來源。</span></li><li><strong>建置檢查</strong><span>生成首頁與文章，檢查資料和內部連結。</span></li><li><strong>驗收發布</strong><span>檢查桌機、手機、搜尋及閱讀狀態，再部署。</span></li></ol></section></div><section class="about-example"><p class="eyebrow">ONE MORE NOTE</p><h2>例如：新增「堆疊與佇列」</h2><p>AI 依規則建立 <code>content/notes/stack-and-queue.json</code>，沿用四節結構與分類，再執行建置。新文章便會自動出現在列表、搜尋與延伸閱讀中，共用既有導覽及樣式。這就是規則可以重複使用的地方。</p></section><p class="credit">製作：劉譯棋 · AI 輔助整理與開發 · 2026 年 11 月</p></main>`;
 await writeFile(path.join(dist,'about.html'),layout('關於專案',about,{active:'about'}));
 await writeFile(path.join(dist,'.nojekyll'),'');
 console.log(`建置完成：${notes.length} 篇文章，${notes.length+2} 個 HTML 頁面。`);
 return notes;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await build();
