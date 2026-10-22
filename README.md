# Gold Fit

Sistema web para controle de produtos, estoque e vendas da loja Gold Fit.

Projeto desenvolvido como trabalho acadêmico do curso de Ciência da Computação.

## Objetivo

Desenvolver um sistema para organizar os produtos da loja, controlar o estoque e registrar informações de clientes, pedidos e pagamentos.

As vendas podem ser registradas por diferentes canais, como site, WhatsApp e loja física.

## Tecnologias

- HTML
- CSS
- JavaScript
- PostgreSQL
- SQL
- Git
- GitHub
- GitHub Actions
- GitHub Pages

## Banco de Dados

O banco foi criado em PostgreSQL e possui tabelas para:

- usuários
- clientes
- produtos
- modelos e variações
- tamanhos
- estoque
- imagens
- pedidos
- pagamentos
- movimentações de estoque
- atendimentos pelo WhatsApp

Também foram criados relacionamentos, índices, views e triggers.

Um dos triggers faz a baixa automática do estoque quando um pagamento é aprovado.

## Controle de Estoque

O módulo de estoque já possui:

- Cadastro de produtos
- Edição e exclusão
- Foto do produto
- Controle por cor e tamanho
- SKU
- Quantidade disponível
- Status do estoque
- Aviso de estoque baixo
- Filtros por grupo e categoria
- Pesquisa de produtos

Os produtos são separados em grupos como Feminino, Masculino, Calçados e Acessórios.

Nesta etapa, os dados da interface são armazenados no LocalStorage do navegador.

A conexão da interface com o PostgreSQL será feita em uma próxima etapa.

## Demonstração

O módulo atual pode ser acessado em:

https://paulovitorlp.github.io/gold-fit/

## Próximas etapas

- Conectar o site ao banco PostgreSQL
- Desenvolver o módulo de produtos
- Desenvolver o módulo de clientes
- Desenvolver o módulo de pedidos
- Registrar vendas feitas pelo WhatsApp
- Integrar pagamentos
- Melhorar o controle de usuários e permissões

## Status

O banco de dados e o módulo inicial de estoque estão funcionando.

Os demais módulos ainda estão em desenvolvimento.