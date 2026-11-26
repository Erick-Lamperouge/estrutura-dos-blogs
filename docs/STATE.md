# Estado do projeto — 2026-11-26
## Etapa 01 / Fundação V2
Branch dev/blog-engine-v2, baseada no main legado 6a2035ed45cd6f88c64d9c7d04bbca8b15b74ab4.
Novo núcleo isolado em v2/; nenhum arquivo legado Jekyll removido. Piloto Futebolando e fixture fictícia culinária, contrato configurável, validação, testes e protótipo Astro. A fixture culinária não é um blog autorizado para publicação.
14 verificações lógicas executadas sobre o contrato e as duas configurações durante preparação. O teste Node foi incluído para execução reprodutível; build Astro ainda não executado.
## Evidências anteriores
estrutura-dos-blogs: tema Jekyll com ads.txt e configuração de publisher existentes.
futebolando: quatro artigos legados, imagens a verificar e 4753 arquivos .venv versionados; ads.txt contém placeholder. Não remover histórico nem imagens antes de migrar e verificar direitos.
senhoritaminuto: Astro 7.2.6, domínio próprio via public/CNAME e deploy Pages. Não há public/ads.txt no inventário inspecionado. O portal não foi alterado.
## Próxima etapa
1. Executar npm test e build da prévia isolada; revisão visual em desktop e celular.
2. Aprovar identidade editorial e categorias do Futebolando; revisar os quatro artigos, fontes e imagens, migrar conteúdo e remover .venv da versão ativa com segurança.
3. Integrar núcleo e conteúdo versionados em build único do portal com /futebolando/; verificar regressão das páginas, assets e mascote originais.
4. Definir política de hospedagem comercial, aprovação AdSense e privacidade; criar ads.txt na raiz somente após confirmação de publisher.
5. Implantar pesquisa agendada em rascunho, revisão humana, deduplicação, registro e posterior publicação controlada.
## Bloqueios
Sem teste de build, integração ou produção; sem confirmação de aprovação AdSense, meios de recebimento, plataforma de checkout, licenças de imagens, tráfego ou faturamento. Não há necessidade de pagar nada nesta fase.
