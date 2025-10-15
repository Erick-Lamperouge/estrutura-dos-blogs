(function(){
  const $ = (s, p=document) => p.querySelector(s);
  const $$ = (s, p=document) => [...p.querySelectorAll(s)];
  const baseurl = document.body.getAttribute('data-baseurl') || '';
  const btn = $('#btn-search');
  const bar = $('#searchbar');
  const form = $('#site-search-form');
  const input = $('#site-search-input');
  const results = $('#search-results');
  const topbar = $('#topbar');

  // Toggle da barra de busca
  if (btn && bar) {
    btn.addEventListener('click', () => {
      const hidden = bar.hasAttribute('hidden');
      if (hidden) bar.removeAttribute('hidden'); else bar.setAttribute('hidden','');
      if (!hidden) results && results.setAttribute('hidden','');
      setTimeout(()=> input && input.focus(), 50);
    });
  }

  // Buscar no posts.json
  async function loadPosts(){
    const url = baseurl.replace(/\/$/,'') + '/posts.json';
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
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const q = (input.value || '').trim();
      if (!q) { results && results.setAttribute('hidden',''); return; }
      try {
        const posts = await loadPosts();
        const hits = posts.filter(p => match(p, q));
        renderResults(q, hits);
        // rola até os resultados
        results.scrollIntoView({behavior:'smooth', block:'start'});
      } catch(err) {
        renderResults(q, []);
      }
    });
  }

  // Esconde a topbar ao rolar para baixo, mostra ao rolar para cima
  let lastY = window.scrollY;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    const down = y > lastY && y > 100;
    topbar && topbar.classList.toggle('topbar--hidden', down);
    lastY = y;
  }, {passive:true});
})();
