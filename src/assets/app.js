(() => {
  const key = 'kejian-read-v1';
  let read = new Set(); let storageWorks = true;
  try {
    const raw = localStorage.getItem(key);
    if(raw !== null) { const value = JSON.parse(raw); if(!Array.isArray(value) || !value.every(x=>typeof x==='string')) throw Error('invalid'); read = new Set(value); }
  } catch { storageWorks = false; }
  const status = document.querySelector('.storage-status');
  function renderRead() {
    document.querySelectorAll('[data-read-badge]').forEach(el => { el.textContent = read.has(el.dataset.readBadge) ? '✓ 已讀' : ''; });
    document.querySelectorAll('[data-read-toggle]').forEach(el => {const yes=read.has(el.dataset.readToggle); el.setAttribute('aria-pressed',String(yes)); el.textContent=yes?'已讀 · 取消標記':'標記已讀 ✓';});
    if(status) status.textContent = storageWorks ? '' : '此瀏覽器無法持久儲存閱讀標記；本頁仍可正常閱讀，標記僅在本次頁面有效。';
  }
  document.querySelectorAll('[data-read-toggle]').forEach(el => el.addEventListener('click',()=> {
    const slug=el.dataset.readToggle; read.has(slug)?read.delete(slug):read.add(slug);
    try {if(!storageWorks) throw Error('unavailable'); localStorage.setItem(key,JSON.stringify([...read]));} catch {storageWorks=false;}
    renderRead();
  }));
  renderRead();
  const input=document.querySelector('#search');
  if(!input) return;
  const cards=[...document.querySelectorAll('[data-note]')];
  const buttons=[...document.querySelectorAll('[data-filter]')];
  const clear=document.querySelector('#clear-filters');
  let category='全部';
  const filter=()=> {
    const query=input.value.trim().toLowerCase(); let count=0;
    for(const card of cards) {const yes=(category==='全部'||card.dataset.category===category)&&card.dataset.search.includes(query);card.hidden=!yes;if(yes)count++;}
    document.querySelector('#result-count').textContent=`顯示 ${count} / ${cards.length} 篇筆記`;
    document.querySelector('#empty-state').hidden=count>0;
    clear.hidden=!query&&category==='全部';
    buttons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.filter===category)));
  };
  input.addEventListener('input',filter);
  buttons.forEach(b=>b.addEventListener('click',()=>{category=b.dataset.filter;filter();}));
  clear.addEventListener('click',()=>{input.value='';category='全部';filter();input.focus();});
})();
