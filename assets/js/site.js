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

  // --- Carrossel de métodos (scroll-snap + controles) ---
  (function(){
    const carousel = document.querySelector('.donate-carousel');
    if(!carousel) return;
    const track = carousel.querySelector('.carousel-track');
    const slides = [...carousel.querySelectorAll('.carousel-slide')];
    const select = document.querySelector('#donate-select');
    const prev = document.querySelector('.carousel-prev');
    const next = document.querySelector('.carousel-next');
    const dots = [...document.querySelectorAll('.carousel-dots .dot')];

    function goToIndex(idx){
      const slide = slides[Math.max(0, Math.min(idx, slides.length-1))];
      carousel.scrollTo({left: slide.offsetLeft - track.offsetLeft, behavior:'smooth'});
      const id = slide.dataset.id;
      if(select){
        const optIndex = [...select.options].findIndex(o => o.value === id);
        if(optIndex >= 0) select.selectedIndex = optIndex;
      }
      dots.forEach(d => d.classList.toggle('is-active', d.dataset.id === id));
    }

    function goToId(id){
      const idx = slides.findIndex(s => s.dataset.id === id);
      if(idx >= 0) goToIndex(idx);
    }

    // Inicial
    goToIndex(0);

    // Botões
    prev?.addEventListener('click', ()=>{
      const idx = currentIndex();
      goToIndex(idx - 1);
    });
    next?.addEventListener('click', ()=>{
      const idx = currentIndex();
      goToIndex(idx + 1);
    });

    // Select
    select?.addEventListener('change', (e)=> goToId(e.target.value));

    // Dots
    dots.forEach((d)=> d.addEventListener('click', ()=> goToId(d.dataset.id)));

    // Atualiza dot/seleção ao scroll manual
    function currentIndex(){
      const left = carousel.scrollLeft + 1; // margem anti-flicker
      let best = 0;
      for(let i=0;i<slides.length;i++){
        if(slides[i].offsetLeft - track.offsetLeft <= left) best = i;
      }
      return best;
    }
    let raf;
    carousel.addEventListener('scroll', ()=>{
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(()=>{
        const idx = currentIndex();
        const id = slides[idx].dataset.id;
        dots.forEach(d => d.classList.toggle('is-active', d.dataset.id === id));
        if(select){
          const optIndex = [...select.options].findIndex(o => o.value === id);
          if(optIndex >= 0) select.selectedIndex = optIndex;
        }
      });
    });
  })();


