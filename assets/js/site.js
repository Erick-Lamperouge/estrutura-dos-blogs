(function(){
  const $ = (s, p=document) => p.querySelector(s);
  const baseurl = document.body.getAttribute('data-baseurl') || '';
  const btn = $('#btn-search');
  const bar = $('#searchbar');
  const form = $('#site-search-form');
  const input = $('#site-search-input');
  const results = $('#search-results');
  const topbar = $('#topbar');

  if (btn && bar) {
    btn.addEventListener('click', () => {
      const hidden = bar.hasAttribute('hidden');
      hidden ? bar.removeAttribute('hidden') : bar.setAttribute('hidden','');
      if (!hidden) results && results.setAttribute('hidden','');
      setTimeout(()=> input && input.focus(), 50);
    });
  }

  async function loadPosts(){
    const url = (baseurl.replace(/\/$/,'') || '') + '/posts.json';
    const r = await fetch(url, {cache:'no-store'});
    if (!r.ok) throw new Error('Falha ao carregar posts.json');
    return await r.json();
  }
  function match(post, q){
    const s = (x)=> (x||'').toString().toLowerCase();
    const hay = [s(post.title), s(post.category), s(post.excerpt), ...(post.tags||[]).map(s)].join(' ');
    return hay.includes(q.toLowerCase());
  }
  function renderResults(q, items){
    if (!results) return;
    const html = [
      `<h2>Resultados para “${q}”</h2>`,
      items.length ? '' : '<p>Nenhum resultado encontrado.</p>',
      ...items.map(p => `
        <div class="search-results__item">
          <a href="${p.url}"><strong>${p.title}</strong></a><br>
          <small>${(p.date||'').slice(0,10)}${p.category? ' • '+p.category : ''}</small>
          <p>${(p.excerpt||'').toString().replace(/<[^>]+>/g,'').slice(0,180)}...</p>
        </div>
      `)
    ].join('\n');
    results.innerHTML = html;
    results.removeAttribute('hidden');
    results.scrollIntoView({behavior:'smooth', block:'start'});
  }
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const q = (input.value || '').trim();
      if (!q) { results && results.setAttribute('hidden',''); return; }
      try { renderResults(q, (await loadPosts()).filter(p => match(p, q))); }
      catch { renderResults(q, []); }
    });
  }

  // esconder topbar ao rolar para baixo
  let lastY = window.scrollY;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    const down = y > lastY && y > 100;
    topbar && topbar.classList.toggle('topbar--hidden', down);
    lastY = y;
  }, {passive:true});
})();

  // --- Copiar códigos na página Sobre ---
  function showToast(text){
    const el = document.createElement('div');
    el.className = 'copy-toast';
    el.textContent = text || 'Copiado!';
    document.body.appendChild(el);
    setTimeout(()=> el.remove(), 1400);
  }

  // Alternar exibição do QR nos cards
  document.addEventListener('click', (ev) => {
    const btn = ev.target.closest('.toggle-qr');
    if(!btn) return;
    const sel = btn.getAttribute('data-target');
    const box = document.querySelector(sel);
    if(!box) return;
    const isHidden = box.hasAttribute('hidden');
    if(isHidden){
      box.removeAttribute('hidden');
      btn.textContent = 'Esconder QR';
    }else{
      box.setAttribute('hidden','');
      btn.textContent = 'Ver QR';
    }
  });

// Copiar código (delegation)
document.addEventListener('click', async (ev) => {
  const btn = ev.target.closest('.copy-code');
  if (!btn) return;
  const text = btn.getAttribute('data-code') || btn.dataset.code || '';
  if (!text) return;

  try {
    await navigator.clipboard.writeText(text);
    showToast('Copiado!');
  } catch {
    // fallback simples
    const ta = document.createElement('textarea');
    ta.value = text; document.body.appendChild(ta);
    ta.select(); document.execCommand('copy');
    ta.remove(); showToast('Copiado!');
  }
});


(function(){
  const wrap = document.querySelector('.donate--slider');
  if(!wrap) return;

  // Evita rodar duas vezes
  if (wrap.dataset.carouselInit === '1') return;
  wrap.dataset.carouselInit = '1';

  const carousel = wrap.querySelector('.donate-carousel');
  const track    = carousel.querySelector('.carousel-track');

  // Remove slides duplicados por data-id (se houver)
  let slides = Array.from(track.querySelectorAll('.carousel-slide'));
  const seen = new Set();
  slides.forEach(s => {
    const id = s.dataset.id || '';
    if (seen.has(id)) s.remove();
    else seen.add(id);
  });
  slides = Array.from(track.querySelectorAll('.carousel-slide')); // re-lê

  const select  = wrap.querySelector('#donate-select');
  const prev    = wrap.querySelector('.carousel-prev');
  const next    = wrap.querySelector('.carousel-next');
  const dotsBox = wrap.querySelector('.carousel-dots');

  // Limpa select + dots antes de montar
  if (select)  select.innerHTML  = '';
  if (dotsBox) dotsBox.innerHTML = '';

  // Monta select e dots com base nos slides
  slides.forEach((s, i) => {
    const id    = s.dataset.id    || String(i+1);
    const label = s.dataset.label || `Opção ${i+1}`;
    select?.add(new Option(label, id));

    const dot = document.createElement('button');
    dot.className = 'dot';
    dot.setAttribute('role','tab');
    dot.dataset.id = id;
    dotsBox.appendChild(dot);
  });

  const dots = Array.from(dotsBox.querySelectorAll('.dot'));
  const labelEl = document.getElementById('donate-current');
  function setActive(idx){
    slides.forEach((s, i) => s.classList.toggle('is-active', i === idx));
    const id = slides[idx].dataset.id || String(idx+1);
    dots.forEach(d => d.classList.toggle('is-active', d.dataset.id === id));
    if (select) {
      const oi = Array.from(select.options).findIndex(o => o.value === id);
      if (oi >= 0) select.selectedIndex = oi;
    }
    if (labelEl) labelEl.textContent = slides[idx].dataset.label || '';
  }

  function goToIndex(idx){
    if (!slides.length) return;
    // Circular
    idx = (idx + slides.length) % slides.length;
    const slide = slides[idx];
    carousel.scrollTo({left: slide.offsetLeft - track.offsetLeft, behavior:'smooth'});
    setActive(idx);
  }

  function currentIndex(){
    const left = carousel.scrollLeft + 1;
    let best = 0;
    for (let i=0;i<slides.length;i++){
      if (slides[i].offsetLeft - track.offsetLeft <= left) best = i;
    }
    return best;
  }

  // Inicial
  goToIndex(0);

  // Navegação
  prev?.addEventListener('click', () => goToIndex(currentIndex() - 1));
  next?.addEventListener('click', () => goToIndex(currentIndex() + 1));

  select?.addEventListener('change', (e)=>{
    const id  = e.target.value;
    const idx = slides.findIndex(s => (s.dataset.id || '') === id);
    if (idx >= 0) goToIndex(idx);
  });

  dots.forEach(d => d.addEventListener('click', ()=>{
    const id  = d.dataset.id;
    const idx = slides.findIndex(s => (s.dataset.id || '') === id);
    if (idx >= 0) goToIndex(idx);
  }));

  // Sincroniza ao arrastar
  let raf;
  carousel.addEventListener('scroll', ()=>{
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(()=>{
      setActive(currentIndex());
    });
  });
})();






