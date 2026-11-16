import {readFile,readdir,stat} from 'node:fs/promises';
import path from 'node:path';
import {root,loadNotes} from '../src/build.mjs';
const notes=await loadNotes();
const dist=path.join(root,'dist');
const pages=['index.html','about.html',...notes.map(n=>`notes/${n.slug}.html`)];
let links=0;
for(const page of pages){
  const html=await readFile(path.join(dist,page),'utf8');
  if(!html.includes('lang="zh-Hant"')||!html.includes('id="main"')||!html.includes('<title>'))throw Error(`${page}: 基本文件結構缺漏`);
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
  if(new Set(ids).size!==ids.length)throw Error(`${page}: id 重複`);
  for(const match of html.matchAll(/\b(?:href|src)="([^"]+)"/g)){
    const url=match[1]; if(/^https:\/\//.test(url)){new URL(url.replaceAll('&amp;','&'));continue;}
    const [pathname,hash]=url.split('#');
    const target=path.resolve(dist,path.dirname(page),pathname||path.basename(page));
    if(!target.startsWith(dist+path.sep))throw Error(`${page}: 路徑越界 ${url}`);
    if(!(await stat(target)).isFile())throw Error(`${page}: 檔案不存在 ${url}`);
    if(hash){const content=await readFile(target,'utf8');if(!content.includes(`id="${hash}"`))throw Error(`${page}: 錨點不存在 ${url}`);}
    links++;
  }
}
const home=await readFile(path.join(dist,'index.html'),'utf8');
if((home.match(/data-note /g)||[]).length!==notes.length)throw Error('首頁文章數不一致');
const actual=(await readdir(path.join(dist,'notes'))).filter(f=>f.endsWith('.html'));
if(actual.length!==notes.length)throw Error('存在遺漏或過期文章頁');
if(await readFile(path.join(root,'AGENTS.md'),'utf8')!==await readFile(path.join(dist,'AGENTS.md'),'utf8'))throw Error('公開規則副本不同步');
console.log(`通過：${notes.length} 份內容契約、${pages.length} 個頁面、${links} 個內部連結與錨點、AGENTS.md 同步。`);
