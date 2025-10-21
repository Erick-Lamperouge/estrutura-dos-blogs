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

  // lembra quem estava visível (para animar só eles)
  let prevTrio = new Set();

  const norm = (i)=> (i % N + N) % N; // mantém a sua

  function setByIndex(i){
    const next = norm(i);
    if (next === current) return;

    // trio atual (para FLIP)
    prevTrio = new Set([ norm(current-1), current, norm(current+1) ]);

    // 1) REALCE PRIMEIRO: tira do atual, coloca no próximo (isso não mexe no layout)
    cards[current]?.classList.remove('is-highlight');
    cards[next]?.classList.add('is-highlight');

    // 2) aplica posição/escala + FLIP (num passo só)
    apply(next);
  }

  function apply(targetIndex = current){
    // FIRST: mede antes de mudar classes
    const first = new Map();
    cards.forEach(c => first.set(c, c.getBoundingClientRect()));

    // calcula novo trio
    const left  = norm(targetIndex - 1);
    const right = norm(targetIndex + 1);
    const newTrio = new Set([ left, targetIndex, right ]);

    // aplica classes de posição (LEFT/CENTER/RIGHT/HIDDEN)
    cards.forEach((c,i)=>{
      c.classList.remove('is-left','is-right','is-center','is-hidden');
      if (i === targetIndex)      c.classList.add('is-center');
      else if (i === left)        c.classList.add('is-left');
      else if (i === right)       c.classList.add('is-right');
      else                        c.classList.add('is-hidden');

      // mantém realce no centro; remove dos demais (caso o setByIndex não tenha rodado)
      if (i === targetIndex) c.classList.add('is-highlight');
      else                   c.classList.remove('is-highlight');
    });

    // atualiza o "current" definitivo
    current = targetIndex;

    // LAST + PLAY: anima deslocamento SÓ de quem já estava visível (evita frame "D/E/A")
    cards.forEach((c,i)=>{
      const a = first.get(c);
      const b = c.getBoundingClientRect();
      const wasVisible = prevTrio.has(i);

      if (wasVisible && a && b && (a.left !== b.left || a.top !== b.top)) {
        const dx = a.left - b.left;
        const dy = a.top  - b.top;
        c.style.translate = `${dx}px ${dy}px`;
        void c.offsetWidth;            // reflow
        c.style.translate = `0 0`;
        const onEnd = (e)=>{
          if (e.propertyName === 'translate') {
            c.style.removeProperty('translate');
            c.removeEventListener('transitionend', onEnd);
          }
        };
        c.addEventListener('transitionend', onEnd);
      } else {
        c.style.removeProperty('translate');
      }
    });

    // UI
    dots.forEach((d,i)=>d.classList.toggle('is-active', i===current));
    if (sel) sel.value = cards[current].dataset.method;
  }

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

  cards[current]?.classList.add('is-highlight');
  apply();
})();
