# Núcleo de blogs — protótipo V2
Prévia isolada, sem ads, checkout, dados de pagamento ou automação. Reutiliza a mesma página Astro e CSS para duas configurações. A página culinaria-demo é apenas uma fixture.
Execute npm install, npm test, npm run build ou npm run dev nesta pasta. Requer ambiente Node compatível com a versão de Astro usada pelo portal. URLs locais: /futebolando/ e /culinaria-demo/. Não implantar esta prévia em produção.
Os títulos demonstrativos não são artigos migrados. A próxima etapa cria rotas e conteúdo verificado. Não há imagens de terceiros nesta prévia; o gráfico decorativo é CSS.

Edições adicionais: /futebolando/en/ e /culinaria-demo/en/. Ambas as versões são apenas prévias, noindex. O módulo priorities.mjs classifica sinais agregados fornecidos; exemplos dos testes são sintéticos. Não coleta métricas, publica ou recebe pagamentos. Ver ../docs/INTERNATIONAL.md.

Para dados de audiência futuros, use rankEvidenceBatch e planEditorialBatch em src/lib/evidence.mjs. Sem conectores reais; fixtures não representam demanda observada.

Design 03B: configurações design, seleção de editorias e busca; CI Chromium gera capturas em blog-design-review. Sem publicação.

03C: seletor local sistema/claro/escuro, densidade minimalista configurável, tipos de mídia local e capturas nos dois modos. Prévia sem artigos finais.

SEO em prévia: `node scripts/verify-seo-preview.mjs` após build. Relatório de 30 rotas fora de dist; nenhum sitemap ou indexação até aprovação editorial. Ver ../docs/SEO-RELEASE.md.
