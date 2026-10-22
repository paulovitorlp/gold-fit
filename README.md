# Gold Fit

Sistema web integrado para vendas e controle de estoque da loja Gold Fit.

Projeto desenvolvido como trabalho acadêmico do curso de Ciência da Computação.

## Objetivo

Desenvolver um sistema web para gerenciamento de produtos, estoque, clientes, pedidos e pagamentos, com integração futura a um agente de Inteligência Artificial através do WhatsApp.

O sistema utiliza um banco de dados SQL compartilhado entre o site e as futuras integrações.

## Tecnologias

- HTML5
- CSS3
- JavaScript
- PostgreSQL
- SQL
- Supabase
- Git e GitHub

## Banco de Dados

O banco de dados PostgreSQL já possui a estrutura principal do sistema.

Atualmente foram implementadas 14 tabelas:

- usuarios
- clientes
- produtos
- modelos_produto
- variacoes_produto
- tamanhos
- estoque
- imagens_produto
- pedidos
- itens_pedido
- pagamentos
- movimentacoes_estoque
- atendimentos_whatsapp
- mensagens_whatsapp

Também foram implementados:

- Chaves primárias
- Chaves estrangeiras
- Constraints
- Views
- Índices
- Triggers
- Controle automático de estoque após pagamento aprovado
- Validação de integridade do banco

## Módulo de Estoque

A primeira interface web implementada é o painel de controle de estoque.

Funcionalidades atuais:

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

A integração da interface com o banco PostgreSQL será realizada nas próximas etapas.

## Produto utilizado para teste

Produto:

Conjunto Top e Short Canelado

Marca:

ALO

Cores:

- Marrom
- Terracota

Tamanhos:

- P
- M
- G
- GG

## Próximas etapas

- Integração do frontend com o banco de dados
- Cadastro de produtos pelo painel administrativo
- Módulo de clientes
- Módulo de pedidos
- Integração de pagamentos
- Integração com WhatsApp
- Agente de Inteligência Artificial
- Sincronização automática de estoque entre site e WhatsApp

## Estrutura do projeto

```text
gold-fit/
├── banco-de-dados/
├── documentacao/
├── site/
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   └── estoque.js
│   └── index.html
└── README.md
```text