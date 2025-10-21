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

  // guarda o trio visível da iteração anterior (índices)
  let prevTrio = new Set();

  const norm = (i)=> (i % N + N) % N; // (mantém sua função existente)

  function setByIndex(i){
    const next = norm(i);
    if (next === current) return;

    // 1) salva o trio visível atual (para animar só quem já estava na tela)
    prevTrio = new Set([ norm(current-1), current, norm(current+1) ]);

    // 2) halo/borda primeiro: promove o novo e despromove o antigo
    cards[current]?.classList.remove('is-center');
    cards[next]?.classList.add('is-center');

    // 3) atualiza o índice atual e aplica a nova posição (com FLIP só no trio anterior)
    current = next;
    apply(); // (a apply já usa prevTrio)
  }

  function apply(){
    // mede a posição antes (FIRST)
    const first = new Map();
    cards.forEach(c => first.set(c, c.getBoundingClientRect()));

    // calcula trio novo
    const left  = norm(current - 1);
    const right = norm(current + 1);
    const newTrio = new Set([ left, current, right ]);

    // aplica classes de posição (LEFT/CENTER/RIGHT/HIDDEN)
    cards.forEach((c,i)=>{
      c.classList.remove('is-left','is-right','is-center','is-hidden');
      if (i === current)      c.classList.add('is-center');
      else if (i === left)    c.classList.add('is-left');
      else if (i === right)   c.classList.add('is-right');
      else                    c.classList.add('is-hidden');
    });

    // mede depois (LAST) e anima o deslocamento (FLIP) SÓ para quem já estava visível
    cards.forEach((c,i)=>{
      const a = first.get(c);
      const b = c.getBoundingClientRect();

      const wasVisible = prevTrio.has(i);       // estava no trio anterior?
      const isVisible  = newTrio.has(i);        // está no trio novo?

      // só aplica translate se ele já estava visível (evita "passagens" estranhas no wrap)
      if (wasVisible && (a && b) && ((a.left !== b.left) || (a.top !== b.top))) {
        const dx = a.left - b.left;
        const dy = a.top  - b.top;
        c.style.translate = `${dx}px ${dy}px`;
        // força reflow
        void c.offsetWidth;
        c.style.translate = `0 0`;
        const onEnd = (e)=>{ if (e.propertyName === 'translate') { c.style.removeProperty('translate'); c.removeEventListener('transitionend', onEnd); } };
        c.addEventListener('transitionend', onEnd);
      } else {
        // não anima quem estava oculto → aparece direto no lugar
        c.style.removeProperty('translate');
      }
    });

    // UI auxiliar
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

  apply();
})();
