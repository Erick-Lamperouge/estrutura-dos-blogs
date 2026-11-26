# Estado do projeto — 2026-11-26
## Etapa 01 / Fundação V2
Branch dev/blog-engine-v2, baseada no main legado 6a2035ed45cd6f88c64d9c7d04bbca8b15b74ab4.
Novo núcleo isolado em v2/; nenhum arquivo legado Jekyll removido. Piloto Futebolando e fixture fictícia culinária, contrato configurável, validação, testes e protótipo Astro. A fixture culinária não é um blog autorizado para publicação.
14 verificações lógicas executadas sobre o contrato e as duas configurações durante preparação. CI adicionada na branch, sem deploy: execução 45861415182 (commit 34b73cf857b6b605c0e242dc340627ff4502aff3) concluída com sucesso, incluindo npm test, instalação de dependências, build Astro e confirmação de ambas as rotas HTML com noindex,nofollow. Evidência: https://github.com/Erick-Lamperouge/estrutura-dos-blogs/actions/runs/45861415182. Ainda falta revisão visual em navegador e migração do conteúdo.
## Evidências anteriores
estrutura-dos-blogs: tema Jekyll com ads.txt e configuração de publisher existentes.
futebolando: quatro artigos legados, imagens a verificar e 4753 arquivos .venv versionados; ads.txt contém placeholder. Não remover histórico nem imagens antes de migrar e verificar direitos.
senhoritaminuto: Astro 7.2.6, domínio próprio via public/CNAME e deploy Pages. Não há public/ads.txt no inventário inspecionado. O portal não foi alterado.
## Etapa 02 / Internacionalização e estratégia adaptativa
Direção híbrida aprovada pelo responsável. Implementação em branch: edição pt-BR e en da prévia Futebolando e da fixture culinária; seleção de idioma com URLs próprias; motor de recomendação com entradas agregadas e política sem apostas; regras de escopo nacional/global e métodos de pagamento candidatos desativados. Espanha/Portugal e outros países são hipóteses; nenhum tráfego real foi coletado. 37 testes novos (51 acumulados), CI desta etapa concluída com sucesso no commit ee19b0cca27331f46e3bbfc27d3af0b66d41de6a: testes Node, instalação, compilação Astro, quatro rotas de prévia, metadados de idioma e links recíprocos. Evidência: https://github.com/Erick-Lamperouge/estrutura-dos-blogs/actions/runs/45863476574. Não houve deploy. Ver docs/INTERNATIONAL.md.
## Próxima etapa
1. Revisar visualmente as prévias bilíngues em desktop e celular (npm test e build concluídos na CI).
2. Direção híbrida aprovada; detalhar identidade visual e categorias do Futebolando; revisar os quatro artigos, fontes e imagens, migrar conteúdo e remover .venv da versão ativa com segurança.
3. Integrar núcleo e conteúdo versionados em build único do portal com /futebolando/; verificar regressão das páginas, assets e mascote originais.
4. Definir política de hospedagem comercial, aprovação AdSense e privacidade; criar ads.txt na raiz somente após confirmação de publisher.
5. Implantar coleta real de métricas e tendências com autorização, pesquisa agendada em rascunho, revisão humana, deduplicação, registro e posterior publicação controlada. O ranking recebe entradas fornecidas; não coleta métricas automaticamente.
## Bloqueios
Build isolado passou; sem teste visual, integração ou produção; sem confirmação de aprovação AdSense, meios de recebimento, plataforma de checkout, licenças de imagens, tráfego ou faturamento. Não há necessidade de pagar nada nesta fase.

## Etapa 02B / Robustez de sinais e cobertura
Ampliação das editorias e tópicos do Futebolando, tradução correspondente, perfis candidatos de moeda, fronteira de evidência com origem, período, escopo e separação de simulações/observações, fila de revisão com cotas e vagas não preenchidas. 18 novos testes incluídos, CI 02B ainda a verificar. Nenhum conector real, gasto, alteração de main ou deploy. Ver docs/INTERNATIONAL.md.
