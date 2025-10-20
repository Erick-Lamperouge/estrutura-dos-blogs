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

  const N = cards.length;
  if (!N) return;

  let current = cards.findIndex(c => c.classList.contains('is-center'));
  if (current < 0) current = 0;

  const norm = (i)=> (i % N + N) % N;

  function apply(){
    const left  = norm(current - 1);
    const right = norm(current + 1);

    cards.forEach((c,i)=>{
      c.classList.remove('is-left','is-right','is-center','is-hidden');
      if (i === current)      c.classList.add('is-center');
      else if (i === left)    c.classList.add('is-left');
      else if (i === right)   c.classList.add('is-right');
      else                    c.classList.add('is-hidden');
    });

    dots.forEach((d,i)=>d.classList.toggle('is-active', i===current));
    if (sel) sel.value = cards[current].dataset.method;
  }

  function setByIndex(i){ current = norm(i); apply(); }

  // Setas
  prev?.addEventListener('click', ()=> setByIndex(current - 1));
  next?.addEventListener('click', ()=> setByIndex(current + 1));

  // Dots
  dots.forEach((d,i)=> d.addEventListener('click', ()=> setByIndex(i)));

  // Select
  sel?.addEventListener('change', ()=>{
    const i = cards.findIndex(c=>c.dataset.method === sel.value);
    if (i >= 0) setByIndex(i);
  });

  // Copiar
  root.addEventListener('click', async (ev) => {
    const btn = ev.target.closest('.btn-copy');
    if (!btn) return;
    const card = btn.closest('.method-card');
    const target = card?.querySelector(btn.getAttribute('data-copy-target') || '.method-code');
    if (!target) return;
    try{
      await navigator.clipboard.writeText(target.textContent.trim());
      const original = btn.textContent;
      btn.textContent = 'Copiado!';
      setTimeout(()=>btn.textContent = original, 1200);
    }catch(e){ console.error(e); }
  });

  apply();
})();
