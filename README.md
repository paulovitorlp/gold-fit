
# GOLD FIT
## Sistema Web Integrado para Vendas e Controle de Estoque com IA e SQL

Projeto acadêmico desenvolvido no curso de **Ciência da Computação da Universidade Federal do Oeste do Pará (UFOPA)**.

O sistema tem como objetivo informatizar os processos de vendas, gerenciamento de produtos e controle de estoque da loja Gold Fit, localizada em Santarém, Pará.

---

## 1. SOBRE O PROJETO

A Gold Fit é uma loja de roupas e acessórios fitness que comercializa produtos femininos, masculinos, calçados e acessórios.

O projeto consiste no desenvolvimento de um sistema web que integra uma loja virtual a um painel administrativo e a um banco de dados relacional.

O sistema está sendo desenvolvido gradualmente, contemplando:

- Loja virtual responsiva;
- Catálogo de produtos;
- Gerenciamento de produtos;
- Controle de estoque;
- Carrinho de compras;
- Cadastro e autenticação de usuários;
- Gerenciamento de clientes;
- Pedidos e pagamentos;
- Integração com WhatsApp;
- Futura utilização de Inteligência Artificial.

**Situação atual:** o frontend demonstrativo está publicado, enquanto o PostgreSQL está estruturado localmente. A integração entre o frontend e o banco de dados ainda será desenvolvida.

---

## 2. OBJETIVO GERAL

Desenvolver um sistema web integrado para gerenciar produtos, estoque e vendas da Gold Fit, utilizando tecnologias de desenvolvimento web e banco de dados SQL.

### Objetivos específicos

- Organizar os produtos em departamentos e categorias;
- Permitir o cadastro e a edição de produtos;
- Controlar variações de cor e tamanho;
- Registrar códigos SKU;
- Monitorar quantidades disponíveis;
- Identificar produtos com estoque baixo;
- Disponibilizar um catálogo online;
- Permitir que clientes adicionem produtos ao carrinho;
- Estruturar o armazenamento de pedidos e pagamentos;
- Preparar a integração com meios de pagamento;
- Implementar futuramente recursos de IA para atendimento.

---

## 3. TECNOLOGIAS UTILIZADAS

### Frontend

- HTML5
- CSS3
- JavaScript

### Banco de dados

- PostgreSQL 16
- SQL
- pgAdmin 4

### Versionamento e publicação

- Git
- GitHub
- GitHub Actions
- GitHub Pages

### Tecnologias planejadas

- Supabase
- PostgreSQL online
- Supabase Auth
- Supabase Storage
- Integração Pix e cartão
- Integração WhatsApp
- Inteligência Artificial

---

## 4. ESTRUTURA DO PROJETO

```text
gold-fit/
│
├── .github/
│   └── workflows/
│       └── deploy.yml
│
├── banco-de-dados/
│   ├── 01_criar_banco.sql
│   ├── 02_criar_tabelas.sql
│   ├── 03_inserir_dados.sql
│   ├── 04_atualizar_dados.sql
│   ├── 05_consultas.sql
│   ├── 06_triggers.sql
│   ├── 07_views.sql
│   ├── 08_indices.sql
│   ├── 09_validacao_banco.sql
│   ├── 10_auditoria_estrutura.sql
│   └── 11_estrutura_atual.sql
│
├── documentacao/
│
├── site/
│   │
│   ├── admin/
│   │   ├── produtos.html
│   │   └── estoque.html
│   │
│   ├── css/
│   │   ├── loja.css
│   │   ├── produto.css
│   │   ├── catalogo.css
│   │   ├── carrinho.css
│   │   ├── produtos-admin.css
│   │   └── style.css
│   │
│   ├── js/
│   │   ├── store-common.js
│   │   ├── loja.js
│   │   ├── produto.js
│   │   ├── menu-produto.js
│   │   ├── catalogo.js
│   │   ├── carrinho.js
│   │   ├── login.js
│   │   ├── produtos-admin.js
│   │   └── estoque.js
│   │
│   ├── index.html
│   ├── produto.html
│   ├── catalogo.html
│   ├── carrinho.html
│   └── login.html
│
├── .gitignore
│
└── README.md
```

---

## 5. FUNCIONALIDADES DO FRONTEND

### 5.1. Página inicial

A página inicial apresenta a identidade visual da Gold Fit, utilizando principalmente as cores preto, amarelo e branco.

Funcionalidades:

- Banner principal;
- Produtos em destaque;
- Lançamentos;
- Produtos organizados por departamentos;
- Navegação por categorias;
- Pesquisa de produtos;
- Acesso ao carrinho;
- Acesso à conta do usuário;
- Layout responsivo.

### 5.2. Menu de navegação

O sistema possui quatro departamentos principais:

- Feminino;
- Masculino;
- Calçados;
- Acessórios.

O menu apresenta categorias e modelos de produtos disponíveis.

As opções são construídas dinamicamente a partir dos dados utilizados pela loja.

### 5.3. Catálogo de produtos

O catálogo permite navegar por:

- Departamento;
- Categoria;
- Modelo de produto;
- Produtos disponíveis.

A página utiliza parâmetros de URL para aplicar os filtros.

Exemplo:

```text
catalogo.html?grupo=Feminino&categoria=Conjuntos
```

### 5.4. Página individual do produto

A página individual permite:

- Visualizar informações do produto;
- Consultar preço;
- Visualizar imagens;
- Ampliar fotos;
- Escolher cor;
- Escolher tamanho;
- Consultar disponibilidade;
- Selecionar quantidade;
- Adicionar à sacola;
- Comprar agora;
- Favoritar produto;
- Visualizar produtos relacionados.

As opções de compra consideram as quantidades cadastradas nos dados demonstrativos.

### 5.5. Carrinho de compras

O carrinho permite:

- Visualizar produtos adicionados;
- Consultar fotos e variações;
- Aumentar e diminuir quantidades;
- Remover itens;
- Calcular o subtotal;
- Visualizar o resumo do pedido;
- Consultar produtos recomendados;
- Adicionar produtos recomendados;
- Compartilhar o carrinho pelo WhatsApp.

Também possui interfaces preparadas para:

- Cupons de desconto;
- Cálculo de frete;
- Checkout;
- Pagamento via Pix;
- Pagamento via cartão.

Essas integrações ainda não realizam operações financeiras reais.

---

## 6. PAINEL ADMINISTRATIVO

O painel administrativo foi desenvolvido para permitir o gerenciamento dos produtos e do estoque por meio de uma interface web.

### 6.1. Gerenciamento de Produtos

Página:

```text
site/admin/produtos.html
```

Funcionalidades:

- Visualização dos produtos;
- Pesquisa;
- Edição de informações;
- Definição de preços;
- Departamento;
- Categoria;
- Marca;
- Imagem principal;
- Publicação de produtos;
- Configuração de produtos em destaque;
- Configuração de lançamentos;
- Ordem de exibição.

Os produtos podem ser marcados como publicados ou não publicados.

O campo de destaque determina quais produtos são apresentados nas seções correspondentes da loja.

### 6.2. Gerenciamento de Estoque

Página:

```text
site/admin/estoque.html
```

Funcionalidades:

- Cadastro de itens e variações;
- Edição de registros;
- Controle de cores;
- Controle de tamanhos;
- Cadastro de SKU;
- Quantidade em estoque;
- Pesquisa de produtos;
- Filtros por departamento e categoria;
- Indicadores de estoque baixo;
- Identificação de produtos sem estoque.

O objetivo é permitir que o estoque real seja cadastrado futuramente diretamente pelo painel administrativo.

### 6.3. Armazenamento atual do Admin

Nesta etapa, os dados da interface são armazenados no **LocalStorage** do navegador.

Portanto:

- Os cadastros realizados em um navegador ficam armazenados nele;
- Os dados não são sincronizados entre computadores;
- O GitHub Pages não funciona como banco de dados;
- A autenticação atual é demonstrativa;
- O painel ainda não grava alterações no PostgreSQL.

A integração com o banco online será realizada posteriormente.

---

## 7. BANCO DE DADOS POSTGRESQL

O banco de dados foi desenvolvido utilizando PostgreSQL.

Nome do banco local:

```text
goldfit_db
```

A estrutura atual possui **16 tabelas**.

### 7.1. Tabelas

| Nº | Tabela | Finalidade |
|---|---|---|
| 1 | usuarios | Dados de usuários e perfis |
| 2 | clientes | Informações dos clientes |
| 3 | departamentos | Departamentos da loja |
| 4 | categorias_produto | Categorias dos departamentos |
| 5 | produtos | Informações gerais dos produtos |
| 6 | modelos_produto | Modelos e marcas |
| 7 | variacoes_produto | Variações de produto |
| 8 | tamanhos | Tamanhos e SKU |
| 9 | estoque | Quantidades disponíveis |
| 10 | imagens_produto | Imagens dos produtos |
| 11 | pedidos | Pedidos realizados |
| 12 | itens_pedido | Produtos de cada pedido |
| 13 | pagamentos | Informações dos pagamentos |
| 14 | movimentacoes_estoque | Histórico de movimentações |
| 15 | atendimentos_whatsapp | Registros de atendimentos |
| 16 | mensagens_whatsapp | Mensagens dos atendimentos |

### 7.2. Relacionamentos

A estrutura principal dos produtos segue:

```text
departamentos
      |
      v
categorias_produto
      |
      v
produtos
      |
      v
modelos_produto
      |
      v
variacoes_produto
      |
      v
tamanhos
      |
      v
estoque
```

Esse modelo permite organizar os produtos por departamentos e categorias, relacionando modelos, cores e tamanhos às respectivas quantidades em estoque.

### 7.3. Integridade dos dados

O banco utiliza recursos como:

- PRIMARY KEY;
- FOREIGN KEY;
- UNIQUE;
- NOT NULL;
- CHECK;
- Índices;
- Triggers;
- Functions;
- Views.

Esses recursos foram utilizados para estabelecer relacionamentos e reduzir inconsistências.

### 7.4. Views

Foram criadas as seguintes views:

```sql
v_estoque_resumido
v_pedidos_detalhados
v_catalogo_site
v_admin_estoque
```

Elas auxiliam na consulta de informações sobre pedidos, produtos e estoque.

### 7.5. Triggers

O banco possui triggers para automatizar operações.

Entre as funcionalidades previstas na estrutura estão:

- Atualização de datas de modificação;
- Processamento de pagamentos aprovados;
- Atualização de registros relacionados ao estoque.

O comportamento completo desses processos ainda precisa ser testado na integração do checkout real.

---

## 8. ARQUIVOS SQL

Os scripts do banco estão disponíveis na pasta:

```text
banco-de-dados/
```

Os arquivos de 01 a 10 representam etapas de desenvolvimento, consultas e validação.

O arquivo:

```text
11_estrutura_atual.sql
```

contém uma exportação mais recente da estrutura do banco PostgreSQL.

O arquivo inclui os objetos do banco, mas não os registros de clientes, usuários ou estoque real.

### Importante

O arquivo de exportação da estrutura deve ser utilizado em um banco vazio.

Não execute automaticamente todos os scripts históricos e depois o arquivo de exportação no mesmo banco, pois isso pode provocar conflitos de objetos duplicados.

---

## 9. EXECUÇÃO LOCAL

### Requisitos

Para trabalhar no frontend:

- Git;
- VS Code ou outro editor;
- Navegador;
- Extensão Live Server ou servidor HTTP local.

Para trabalhar com o banco:

- PostgreSQL;
- pgAdmin ou outra ferramenta SQL.

### 9.1. Clonar o projeto

Execute no terminal:

```bash
git clone https://github.com/paulovitorlp/gold-fit.git
```

Entre na pasta:

```bash
cd gold-fit
```

Abra no VS Code:

```bash
code .
```

### 9.2. Executar o site

Abra:

```text
site/index.html
```

Clique com o botão direito e selecione:

```text
Open with Live Server
```

Como alternativa, na raiz do projeto:

```bash
python -m http.server 5500
```

Depois abra:

```text
http://localhost:5500/site/index.html
```

O banco PostgreSQL não é necessário para navegar na versão demonstrativa atual.

---

## 10. PUBLICAÇÃO NO GITHUB PAGES

O frontend é publicado automaticamente utilizando GitHub Actions e GitHub Pages.

Arquivo responsável:

```text
.github/workflows/deploy.yml
```

A publicação utiliza os arquivos da pasta:

```text
site/
```

Quando alterações nessa pasta são enviadas à branch principal, o workflow realiza uma nova publicação.

### Site online

https://paulovitorlp.github.io/gold-fit/

### Repositório

https://github.com/paulovitorlp/gold-fit

O professor e outros colaboradores autorizados podem acessar e editar os arquivos do projeto no GitHub.

A publicação da interface não disponibiliza automaticamente o banco PostgreSQL local.

---

## 11. FUNCIONALIDADES EM DESENVOLVIMENTO

As seguintes funcionalidades ainda precisam ser concluídas ou integradas:

- Banco PostgreSQL online;
- Integração do Admin Produtos com SQL;
- Integração do Admin Estoque com SQL;
- Autenticação real;
- Controle seguro de permissões;
- Cadastro de clientes integrado;
- Registro de pedidos;
- Checkout;
- Pagamento Pix;
- Pagamento com cartão;
- Cálculo de frete;
- Gestão de entregas;
- Avaliações de clientes;
- Atendimento pelo WhatsApp;

---

## 12. PRÓXIMAS ETAPAS

### Etapa 1 — Frontend

- Aperfeiçoar as páginas;
- Melhorar a responsividade;
- Revisar a experiência de compra;
- Testar produtos, carrinho e navegação.

### Etapa 2 — Integração com Supabase

- Criar o projeto Supabase;
- Preparar o PostgreSQL online;
- Implantar a estrutura SQL;
- Configurar autenticação;
- Configurar políticas de segurança;
- Conectar produtos e estoque ao banco.

### Etapa 3 — Estoque real

- Cadastrar produtos pelo Admin;
- Cadastrar modelos;
- Cadastrar cores e tamanhos;
- Informar SKU;
- Registrar quantidades reais;
- Validar a atualização do catálogo.

### Etapa 4 — Vendas

- Implementar checkout;
- Registrar pedidos;
- Integrar pagamentos;
- Controlar movimentações de estoque;
- Gerenciar clientes e entregas.

### Etapa 5 — Inteligência Artificial

- Integrar atendimento pelo WhatsApp;
- Consultar produtos disponíveis;
- Consultar estoque;
- Auxiliar no atendimento de clientes;
- Registrar interações no banco de dados.

---

## 13. STATUS ATUAL

| Componente | Situação |
|---|---|
| Estrutura do projeto | Concluída |
| Loja virtual demonstrativa | Implementada |
| Catálogo e filtros | Implementados |
| Página individual do produto | Implementada |
| Carrinho demonstrativo | Implementado |
| Admin de Produtos | Implementado com LocalStorage |
| Admin de Estoque | Implementado com LocalStorage |
| PostgreSQL local | Estruturado |
| Chaves e relacionamentos | Implementados |
| Views e triggers | Implementados |
| GitHub | Atualizado |
| GitHub Pages | Publicado |
| PostgreSQL online | Pendente |
| Integração frontend/banco | Pendente |
| Autenticação segura | Pendente |
| Checkout e pagamentos reais | Pendente |


---

## 14. CONSIDERAÇÕES FINAIS

O projeto Gold Fit está sendo desenvolvido de maneira incremental.

A estrutura inicial do sistema já permite demonstrar o funcionamento de uma loja virtual, o gerenciamento de produtos e o controle de estoque por meio de interfaces web.

O banco PostgreSQL foi estruturado separadamente para servir como base da futura integração.

A próxima fase consiste em conectar o frontend ao banco de dados online, permitindo que produtos e quantidades cadastrados no painel administrativo sejam sincronizados entre diferentes dispositivos.

**Projeto acadêmico em desenvolvimento.**
