# GOLD FIT
### Sistema Web Integrado para Vendas, Controle de Estoque e Geração de Imagens com IA

Projeto acadêmico desenvolvido por **Paulo Vitor Loiola Palheta**, estudante de Ciência da Computação da Universidade Federal do Oeste do Pará (UFOPA).

## 1. Sobre o projeto

O Gold Fit é um sistema web desenvolvido para informatizar os processos de vendas, gerenciamento de produtos e controle de estoque de uma loja de roupas e acessórios fitness em Santarém (PA).

O sistema contempla:

- Loja virtual com catálogo e carrinho;
- Painel administrativo de produtos;
- Controle de estoque por cor, tamanho e SKU;
- Banco de dados PostgreSQL;
- Backend Node.js com API REST;
- Contato pelo WhatsApp;
- Geração de imagens de produtos com inteligência artificial.

## 2. Tecnologias

| Camada | Tecnologias |
|---|---|
| Frontend | HTML, CSS e JavaScript |
| Backend | Node.js e Express |
| Banco de dados | PostgreSQL 16 |
| Infraestrutura | Docker e Docker Compose |
| Inteligência Artificial | OpenAI API |
| Versionamento | Git e GitHub |

## 3. Arquitetura

A aplicação será organizada em três contêineres Docker:

1. **Site:** frontend da loja e interfaces administrativas.
2. **Estoque:** backend Node.js, API REST e regras de negócio.
3. **Banco:** PostgreSQL e armazenamento persistente.

O Docker será utilizado para isolar os serviços e facilitar a implantação.

## 4. Banco de dados

O PostgreSQL possui **16 tabelas**, com relacionamentos, índices, funções, triggers e views.

A estrutura contempla produtos, categorias, variações, tamanhos, estoque, clientes, pedidos e pagamentos.

Arquivo principal:

`banco-de-dados/11_estrutura_atual.sql`

## 5. Inteligência artificial

Está previsto um módulo para geração de fotografias comerciais utilizando a OpenAI API.

O administrador poderá enviar a foto de um produto, selecionar uma modelo virtual e gerar imagens da peça sendo utilizada.

O sistema contará inicialmente com:

- 5 modelos virtuais femininos;
- 5 modelos virtuais masculinos;
- Geração de imagens em diferentes cores;
- Prompts padronizados;
- Revisão e aprovação antes da publicação.

**Não haverá agente de atendimento por IA.** O WhatsApp será utilizado apenas como canal de contato com os clientes.

## 6. Situação atual

### Desenvolvido

- [x] Loja virtual demonstrativa;
- [x] Catálogo e página de produtos;
- [x] Carrinho demonstrativo;
- [x] Interfaces administrativas;
- [x] Estrutura PostgreSQL;
- [x] Estrutura inicial do backend;
- [x] Publicação no GitHub Pages.

### Próximas etapas

- [ ] Finalizar a conexão Node.js/PostgreSQL;
- [ ] Configurar os três contêineres Docker;
- [ ] Integrar frontend, backend e banco;
- [ ] Implementar autenticação e pedidos;
- [ ] Adicionar o botão de WhatsApp;
- [ ] Desenvolver o gerador de imagens com IA;
- [ ] Realizar testes e publicar a versão completa.

## 7. Execução local

Clone o repositório:

```bash
git clone https://github.com/paulovitorlp/gold-fit.git
cd gold-fit
```

Para iniciar o backend no Windows:

```powershell
cd backend
npm.cmd install
npm.cmd start
```

Configure antes o arquivo `backend/.env` utilizando `.env.example` como referência.

O servidor utiliza a porta `3000`. A conexão PostgreSQL ainda está em fase de validação.

A execução completa via Docker será disponibilizada nas próximas etapas.

## 8. Links

**Repositório:**  
https://github.com/paulovitorlp/gold-fit

**Site demonstrativo:**  
https://paulovitorlp.github.io/gold-fit/

---

**Autor:** Paulo Vitor Loiola Palheta  
**Curso:** Ciência da Computação — UFOPA  
**Local:** Santarém — Pará