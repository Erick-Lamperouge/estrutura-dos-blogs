(function(){
  const root = document.querySelector('.support');
  if (!root) return;

  const $  = (s, p=root)=>p.querySelector(s);
  const $$ = (s, p=root)=>[...p.querySelectorAll(s)];

  const sel = $('#support-select');
  const viewport = $('#support-viewport');
  const cards = $$('.method-card', viewport);
  const dots  = $$('.carousel-dots .dot');
  const prev  = $('.carousel-btn.prev');
  const next  = $('.carousel-btn.next');

  function setActiveByIndex(i){
    const idx = Math.max(0, Math.min(cards.length-1, i));
    cards.forEach((c,k)=>c.classList.toggle('is-active', k===idx));
    dots.forEach((d,k)=>d.classList.toggle('is-active', k===idx));
    if (sel) sel.value = cards[idx].dataset.method;
    if (viewport) viewport.scrollTo({ left: cards[idx].offsetLeft - 12, behavior:'smooth' });
  }

  function indexOfActive(){ return cards.findIndex(c=>c.classList.contains('is-active')); }

  sel?.addEventListener('change', () => {
    const i = cards.findIndex(c=>c.dataset.method === sel.value);
    setActiveByIndex(i === -1 ? 0 : i);
  });

  dots.forEach((d,i)=>d.addEventListener('click', ()=>setActiveByIndex(i)));
  prev?.addEventListener('click', ()=>setActiveByIndex(indexOfActive()-1));
  next?.addEventListener('click', ()=>setActiveByIndex(indexOfActive()+1));

  document.addEventListener('click', async (ev) => {
    const btn = ev.target.closest('.btn-copy');
    if (!btn || !root.contains(btn)) return;
    const card = ev.target.closest('.method-card');
    const target = card?.querySelector(btn.getAttribute('data-copy-target') || '.method-code');
    if (!target) return;
    try {
      await navigator.clipboard.writeText(target.textContent.trim());
      const original = btn.textContent;
      btn.textContent = 'Copiado!';
      setTimeout(()=>btn.textContent = original, 1200);
    } catch(e) { console.error(e); }
  });

  const start = sel?.value || (cards[0]?.dataset.method);
  const startIndex = cards.findIndex(c=>c.dataset.method === start);
  setActiveByIndex(startIndex === -1 ? 0 : startIndex);
})();
