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

## Primeira conferência assistida da série de regras
Fonte editorial 2cc3e76ee3e6c5459ca48dfce71fd3435e2fbfea: https://github.com/Erick-Lamperouge/futebolando/blob/dev/editorial-v2/editorial/REVIEW-RULES-2026-11-26.md. Quatro artigos, oito versões de idioma, aprimorados com base na IFAB consultada (2026/27) e histórico 2025/26. Nenhuma aprovação humana registrada. Rascunhos continuam não indexáveis. As demais pautas (Real Madrid, Libertadores, Barcelona, xG) aguardam revisão específica. CI anterior do SEO 45910175434 passou (171 testes, 30 rotas, 60 alternates, seis cenários). Após atualizar snapshot, revalidar.

## 06B — conferência assistida de oito matérias
Revisão 06A das regras em 2cc3e76ee3e6c5459ca48dfce71fd3435e2fbfea; revisão 06B das quatro restantes em 9dbbe590b7ca38df9b5a23dec343ddbb6df99c3d. Relatórios no repositório Futebolando: editorial/REVIEW-RULES-2026-11-26.md e editorial/REVIEW-CLUBS-STATS-2026-11-26.md. Confirmadas fontes de Real Madrid, UEFA, Barcelona, FIFA Training Centre, StatsBomb. Manual CONMEBOL de fevereiro conferido por texto §§2.4.1–2.4.4; capturas PDF 54/55 bloqueadas, fonte 2025 recuperada via índice textual; confirmar originais e eventuais circulares antes de publicar. Atualizado endereço do manual 2026 e fonte xG indisponível. Oito artigos, 16 versões, todos ainda draft. Revisão assistida não equivale a aprovação humana; pendentes imagens, inglês independente, autoria e data, revisão humana final. Nenhum sitemap nem Search Console ativo. Novo snapshot exige CI e integração de pins.

## Cadernos de revisão
[Português](REVIEW-PT.md) e [English](REVIEW-EN.md) são reproduções legíveis do snapshot editorial 9dbbe590b7ca38df9b5a23dec343ddbb6df99c3d; contêm referências e ilustrações. Não são fonte de edição nem aprovação. Atualizar a reprodução ao alterar o pin.

06C: fluxo por matéria em [PUBLICATION.md](PUBLICATION.md); ledger real permanece vazio, noindex obrigatório.
