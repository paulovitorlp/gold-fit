# Gold Fit

Sistema web integrado para vendas e controle de estoque da loja Gold Fit.

Projeto desenvolvido como trabalho acadêmico do curso de Ciência da Computação.

## Objetivo

Desenvolver um sistema web para gerenciamento de produtos, estoque, clientes, pedidos e pagamentos, com integração futura a um agente de Inteligência Artificial através do WhatsApp.

O sistema utilizará um banco de dados SQL compartilhado entre o site e as futuras integrações, permitindo que informações de produtos, preços, tamanhos e estoque sejam consultadas e atualizadas de forma centralizada.

## Tecnologias

- HTML5
- CSS3
- JavaScript
- PostgreSQL
- SQL
- Supabase
- Git
- GitHub

## Banco de Dados

O banco de dados PostgreSQL já possui a estrutura principal do sistema.

Atualmente foram implementadas 14 tabelas:

- `usuarios`
- `clientes`
- `produtos`
- `modelos_produto`
- `variacoes_produto`
- `tamanhos`
- `estoque`
- `imagens_produto`
- `pedidos`
- `itens_pedido`
- `pagamentos`
- `movimentacoes_estoque`
- `atendimentos_whatsapp`
- `mensagens_whatsapp`

Também foram implementados:

- Chaves primárias
- Chaves estrangeiras
- Constraints
- Views
- Índices
- Triggers
- Controle automático de estoque após pagamento aprovado
- Validação de integridade do banco
- Auditoria da estrutura e dos relacionamentos

## Módulo de Estoque

A primeira interface web implementada é o painel de controle de estoque.

### Funcionalidades atuais

- Visualização das variações de produtos
- Pesquisa de produtos
- Controle por cor
- Controle por tamanho
- Identificação por SKU
- Indicador de quantidade
- Status de estoque
- Alerta de estoque baixo
- Alteração de quantidade
- Persistência temporária utilizando LocalStorage

Neste estágio, os dados exibidos pela interface ainda são dados temporários do frontend.

A integração da interface com o banco PostgreSQL será realizada nas próximas etapas do projeto.

## Produto utilizado para teste

**Produto:** Conjunto Top e Short Canelado

**Marca:** ALO

**Cores:**

- Marrom
- Terracota

**Tamanhos:**

- P
- M
- G
- GG

## Organização do Banco de Dados

A estrutura principal do catálogo segue o relacionamento:

```text
Produto
   ↓
Modelo
   ↓
Variação
   ↓
Tamanho
   ↓
Estoque
```

O fluxo de vendas foi estruturado para funcionar da seguinte forma:

```text
Cliente
   ↓
Pedido
   ↓
Itens do Pedido
   ↓
Pagamento
   ↓
Pagamento aprovado
   ↓
Baixa automática no estoque
   ↓
Registro da movimentação
```

## Próximas etapas

- Integração do frontend com o banco de dados
- Cadastro de produtos pelo painel administrativo
- Módulo de clientes
- Módulo de pedidos
- Integração de pagamentos
- Integração com WhatsApp
- Agente de Inteligência Artificial
- Sincronização automática de estoque entre site e WhatsApp

## Estrutura do Projeto

```text
gold-fit/
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
│   └── 10_auditoria_estrutura.sql
│
├── site/
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   └── estoque.js
│   └── index.html
│
├── .gitignore
└── README.md
```

## Status do Projeto

### Concluído

- Modelagem inicial do banco de dados
- Criação das tabelas
- Relacionamentos entre tabelas
- Chaves primárias e estrangeiras
- Views
- Triggers
- Índices
- Validação do banco de dados
- Auditoria da estrutura
- Interface inicial do módulo de estoque
- Publicação inicial do projeto no GitHub

### Em desenvolvimento

- Integração frontend e banco de dados
- Painel administrativo para cadastro de produtos
- Gerenciamento de clientes
- Gerenciamento de pedidos
- Integração com pagamentos
- Integração com WhatsApp
- Agente de Inteligência Artificial

## Observação

O projeto encontra-se em desenvolvimento e este repositório representa o andamento atual da implementação.