# Estrutura dos Blogs — Tema remoto (Jekyll)

Olá! Este é o meu **primeiro repositório público** para tema remoto Jekyll, feito para **mostrar meu trabalho** e permitir múltiplos blogs com **uma única estrutura**.

> Objetivo: centralizar layout/UX/SEO/Ads aqui e deixar os blogs consumidores focados apenas no conteúdo e na configuração.

## Recursos principais
- Home em **cards** (imagem + título + data + resumo), responsiva e com **dark mode**.
- **Sidebars para anúncios** (laterais) e **bloco de anúncio** dentro do post.
- Includes parametrizados para **Google AdSense** via `_config.yml` do blog.
- SEO básico (`jekyll-seo-tag`), feed (`jekyll-feed`) e sitemap (`jekyll-sitemap`).
- Padrão **blog-aware** do Jekyll (`_posts/YYYY-MM-DD-slug.md`, `tags`, `category`, `cover`).

## Como usar (no blog consumidor)
No `_config.yml` do blog:

```yml
plugins:
  - jekyll-remote-theme
  - jekyll-feed
  - jekyll-seo-tag
  - jekyll-sitemap

# aponte para este tema
remote_theme: Erick-Lamperouge/estrutura-dos-blogs@main
# ou fixe uma versão: @v0.1.0

# (opcional) anúncios
adsense_client_id: ""      # ex.: "ca-pub-1234567890123456"
ads:
  sidebar_slots: []        # ex.: ["1111111111","2222222222"]
  in_article_slot: ""      # ex.: "3333333333"
```

Crie a **home** com o layout do tema:

```md
---
layout: home
title: Início
---
```

Publique posts em `_posts/` (com data no nome) e use `tags`, `category` e `cover:` no front matter.

## Notas
- Este repositório é parte de um ecossistema com **vários blogs temáticos** (ex.: futebol, culinária) e um **Agente** automatizador que cria/atualiza posts, verifica duplicidade via `/posts.json` e pode atualizar versões do tema.
- Feedbacks são bem-vindos via Issues/PRs. Obrigado por conferir meu trabalho! 🙌
