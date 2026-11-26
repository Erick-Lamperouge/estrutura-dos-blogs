# SEO e preparação editorial — 06A
Escopo: Futebolando publicado como prévia técnica no domínio https://senhoritaminuto.com.br. O estado editorial permanece draft; noindex,nofollow obrigatório em todas as páginas até autorização e revisão. Nenhum acesso novo a Search Console ou GA4; sem coleta, anúncio ou pagamento.
## Implementação
- seo.mjs usa o domínio oficial somente para o blog efetivamente integrado. URLs seguras e autocanônicas, por página e idioma; hreflang recíproco, autoinclusão e somente traduções que existem. Não apontar a edição inglesa para a portuguesa.
- BlogShell inclui canonical, alternates, título, descrição e Open Graph básico, em prévia. Culinária demo permanece noindex e não recebe endereço de produção.
- Inventário derivado dos catálogos validados: home PT/EN, índice e cinco séries piloto PT/EN, oito artigos PT/EN. 30 páginas. Não inventar links para séries planejadas. Verificação pós-build compara todas as rotas e o head com o inventário, gera review-shots/seo-inventory.json só no artefato CI, fora de dist.
- Nenhuma URL elegível a sitemap enquanto draft/noindex. Não gerar sitemap XML, não enviar URLs ao Google e não bloquear a leitura de noindex via robots.txt. Os metadados são preparação, não garantem descoberta ou ranking. Não emitir datePublished, dateModified ou autoria fictícios; schema de artigo aguarda dados editoriais aprovados.
## Gate antes de indexar
1. Revisar individualmente os oito artigos nas duas edições, conferindo fontes/versões, precisão, fluidez e imagens/alt/crédito; registro de revisão humana e aprovação do responsável.
2. Tratar especialmente a inspeção original dos manuais CONMEBOL 2026/2025 (403 em etapa anterior), o histórico de títulos UEFA com data de corte, o caráter hipotético dos diagramas e xG e a ausência de fotografia sem licença.
3. Definir estado de publicação, data real e autoria transparente. Separar publicação de rascunho em código e impedir rascunhos nos índices públicos. Não ativar por troca simples de noindex. Inventário é uma fila de revisão, não autorização.
4. Depois do gate aprovado, gerar sitemap somente de páginas canônicas elegíveis e preparar Search Console (propriedade de domínio, verificação DNS ou método suportado; o proprietário deve autorizar). Validar resposta pública, robots, reciprocidade, schema e links. Métricas reais só após coleta autorizada, não inventar audiência.
Referências oficiais consultadas 26/11/2026:
- https://developers.google.com/search/docs/specialty/international/localized-versions
- https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls
- https://developers.google.com/search/docs/crawling-indexing/block-indexing
- https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
- https://developers.google.com/search/docs/appearance/structured-data/article
