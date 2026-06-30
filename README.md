# 📦 Sistema de Gestão de Pedidos de Materiais

Sistema completo para gestão e distribuição de materiais entre lojas da Rede Sabrina.

## 🚀 Funcionalidades

### 📋 Gestão de Pedidos
- **Criar Pedidos**: Interface intuitiva para seleção de produtos e quantidades
- **Acompanhamento**: Visualização de todos os pedidos com filtros por período
- **Status**: Controle de status (Pendente, Impresso, Concluído)
- **Impressão**: 
  - Matriz de separação em uma única folha (formato paisagem)
  - Relatórios detalhados por loja
  - Filtro automático apenas para pedidos pendentes

### 🏪 Gestão por Loja
- **Pedidos por Loja**: Visualização individualizada
- **Histórico**: Acompanhamento de todos os pedidos da loja
- **Relatórios Específicos**: Impressão de pedidos separados por loja

### 📊 Relatórios Gerenciais
- **Dashboard**: Visão geral com KPIs e métricas principais
  - Total de pedidos
  - Total de itens solicitados
  - Materiais diferentes
  - Média de itens por pedido
  - Top 5 materiais mais solicitados
  - Pedidos por status
  - Performance por loja (admin)

- **Relatório de Período**:
  - Total geral de materiais
  - Distribuição por loja (matriz completa)
  - Filtros de data personalizados
  - Exportação para impressão

### 📦 Gestão de Estoque (Admin)
- **Cadastro de Produtos**: Código automático sequencial
- **Ativar/Desativar**: Controle de disponibilidade
- **Editar/Excluir**: Gestão completa do catálogo
- **Paginação**: 15 produtos por página

### 👥 Gestão de Usuários (Admin)
- **Cadastro de Usuários**: Criação de novas contas
- **Controle de Acesso**: Diferenciação entre ADMIN e LOJA
- **Permissões**: 
  - ADMIN: Acesso completo a todas as funcionalidades
  - LOJA: Acesso restrito aos próprios pedidos

## 🛠️ Tecnologias

### Frontend
- **React** com Vite
- **React Router** para navegação
- **TailwindCSS** para estilização
- **Context API** para estado global

### Backend
- **Node.js** com Express
- **MongoDB** (Atlas) para banco de dados
- **JWT** para autenticação
- **bcrypt** para hash de senhas

## 📁 Estrutura do Projeto

```
materiais/
├── front/
│   ├── api-src/          # Backend (Node.js + Express)
│   │   ├── controllers/  # Controladores da API
│   │   ├── models/       # Modelos do MongoDB
│   │   ├── routes/       # Rotas da API
│   │   ├── services/     # Regras de negócio
│   │   ├── middlewares/  # Auth e validações
│   │   └── data/         # Dados fallback
│   └── src/              # Frontend (React)
│       ├── components/   # Componentes reutilizáveis
│       ├── pages/        # Páginas da aplicação
│       ├── services/     # Integração com API
│       ├── utils/        # Funções utilitárias
│       └── layouts/      # Layouts da aplicação
└── README.md
```

## 🔐 Perfis de Acesso

### ADMIN
- ✅ Visualizar todos os pedidos de todas as lojas
- ✅ Gerenciar produtos (criar, editar, excluir, ativar/desativar)
- ✅ Gerenciar usuários
- ✅ Acessar relatórios completos
- ✅ Imprimir matrizes de separação
- ✅ Alterar status de pedidos
- ✅ Excluir pedidos

### LOJA
- ✅ Criar novos pedidos
- ✅ Visualizar apenas seus próprios pedidos
- ✅ Acompanhar status dos seus pedidos
- ✅ Imprimir seus pedidos pendentes
- ❌ Não acessa gestão de produtos
- ❌ Não acessa gestão de usuários
- ❌ Não vê pedidos de outras lojas

## 🚀 Como Rodar

### Pré-requisitos
- Node.js 16+
- MongoDB Atlas configurado
- Variáveis de ambiente configuradas

### Instalação

```bash
# Instalar dependências do frontend
cd front
npm install

# Instalar dependências do backend
cd api-src
npm install

# Configurar variáveis de ambiente
# Criar arquivo .env com:
# PORT=3000
# MONGODB_URI=sua_connection_string
# JWT_SECRET=seu_secret
```

### Execução

```bash
# Rodar backend (terminal 1)
cd front/api-src
npm run dev

# Rodar frontend (terminal 2)
cd front/src
npm run dev
```

## 📄 Recursos de Impressão

### Matriz de Separação
- Formato paisagem (A4)
- Todas as lojas em uma única folha
- Produtos em ordem alfabética
- Células coloridas por quantidade:
  - 🟨 Amarelo claro: 1-4 unidades
  - 🟧 Amarelo médio: 5-9 unidades
  - 🟠 Laranja: 10+ unidades
  - ⬜ Branco: Sem pedido
- Apenas pedidos com status "Pendente"
- Bordas destacadas (2px) para facilitar recorte

### Relatório por Loja
- Formato retrato (A4)
- Cada loja em uma seção separada
- Detalhes completos dos pedidos
- Itens de cada pedido
- Apenas pedidos pendentes

### Relatório Gerencial
- Formato paisagem (A4)
- Resumo do período
- Total de materiais
- Matriz completa loja × material
- Otimizado para caber em uma página

## 🔒 Segurança

- Autenticação JWT com expiração
- Senhas criptografadas com bcrypt
- Middleware de proteção de rotas
- Separação de responsabilidades por perfil
- Validação de ownership de pedidos

## 📊 Métricas e KPIs

O dashboard fornece:
- Total de pedidos no período
- Total de itens solicitados
- Quantidade de materiais diferentes
- Média de itens por pedido
- Distribuição por status
- Ranking de materiais mais solicitados
- Performance por loja

## 🤝 Contribuição

Este projeto foi desenvolvido para a Rede Sabrina. Para mudanças ou melhorias, entre em contato com a equipe de desenvolvimento.

## 📝 Licença

Uso interno - Rede Sabrina

---

**Desenvolvido com ❤️ para otimizar a distribuição de materiais**