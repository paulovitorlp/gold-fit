# Gold Fit Santarém

**Sistema web de catálogo, controle de estoque e estúdio de imagens com IA.**

Projeto acadêmico de **Paulo Vitor Loiola Palheta**, do curso de Ciência da Computação da **Universidade Federal do Oeste do Pará (UFOPA)**, aplicado a uma loja de moda fitness em Santarém (PA).

**Links:** [Site](https://paulovitorlp.github.io/gold-fit/) · [Repositório](https://github.com/paulovitorlp/gold-fit) · [Histórico de imagens](https://paulovitorlp.github.io/gold-fit/admin/estudio-demo.html)

## Objetivo

Integrar a loja virtual ao gerenciamento de produtos, estoque e fotografias, evitando cadastros duplicados. Cada modelo reúne variações de **cor, tamanho, SKU e quantidade** e pode ser publicado diretamente pelo painel administrativo.

## Tecnologias

| Camada | Tecnologias |
| --- | --- |
| Interface | HTML, CSS e JavaScript |
| API e autenticação | Node.js e Express |
| Banco de dados | PostgreSQL 16 |
| Infraestrutura | Docker, Docker Compose e Nginx |
| Imagens com IA | API da OpenAI, utilizada somente pelo backend privado |
| Versionamento e demonstração | Git, GitHub Actions e GitHub Pages |

O Docker executa três serviços: **`site`** (Nginx), **`painel`** (API Node.js, estoque e Gerador IA) e **`banco`** (PostgreSQL).

## Funcionalidades

- Loja com catálogo, categorias, pesquisa, carrinho e páginas de produtos.
- Painel **Produtos e Estoque** unificado, com variações, preços, quantidades, fotos e publicação.
- Galeria por cor com definição da foto de capa e organização das imagens.
- Produtos publicados podem aparecer com imagem provisória; **uma cor só é liberada para compra quando há foto de uma modelo vestindo essa cor e estoque disponível**.
- Estúdio IA com seleção de modelos, referências de produtos e histórico de imagens geradas.
- Demonstração pública com painel semelhante ao original, **5 modelos virtuais e 36 imagens do histórico**.

## Executar o sistema completo

Com o **Docker Desktop** aberto, na pasta que contém `compose.yaml`, configure seu `.env` local e execute:

```powershell
docker compose up -d --build
docker compose ps
```

**Acessos locais:** [Loja](http://127.0.0.1:8080/) · [Produtos e Estoque](http://127.0.0.1:8080/admin/produtos.html) · [Gerador IA](http://127.0.0.1:8080/admin/gerador-imagens.html).

## Demonstração no GitHub Pages / Live Server

A versão pública permite entrar no **painel demonstrativo**, explorar o estoque, testar cadastros e publicação, selecionar modelos e consultar imagens já geradas. Essas alterações ficam **apenas no navegador de quem está testando**, sem sincronizar com o PostgreSQL privado. **Não é possível gerar novas imagens com IA** nessa versão.

**Acesso demonstrativo:** `admin@goldfit.demo` / `goldfitjade2026`.

O catálogo demonstrativo pode mostrar imagens provisórias: as quatro fotos adicionais da atualização V30 **não fazem parte desta versão**.

> **Segurança:** a API e o banco permanecem privados. Nunca publique o `.env`, chaves da OpenAI, backups `.dump` ou fotos privadas. A senha demonstrativa visível não deve ser reutilizada como senha de um servidor público.

O GitHub Pages publica a pasta `site/` por meio de `.github/workflows/deploy.yml`. Para atualizar o site público, envie os arquivos revisados ao repositório na branch `main`.

---

**UFOPA · Ciência da Computação · Santarém (PA) · 2026**
