# Plataforma Devolucao 🚚📦

Painel de devolucoes para upload de XML de NF-e, criacao e acompanhamento de devolucoes, com perfis de loja e admin.

## Visao geral ✨
- Frontend: React + Vite + Tailwind (pasta [front](front))
- Backend: API Express embarcada como serverless em [front/api](front/api) e [front/api-src](front/api-src)
- Banco: MongoDB (Mongoose)

## Estrutura do projeto 🧱
- [front](front): app web e API serverless
	- [front/src](front/src): frontend React
	- [front/api](front/api): entry da function
	- [front/api-src](front/api-src): API Express e regras de negocio
- [back](back): legado (nao usado)

## Requisitos ✅
- Node.js 18+
- MongoDB (Atlas ou local)

## Como rodar localmente ▶️
```bash
cd "C:\Users\User\Desktop\plataforma devolucao\front"
npm install
npm run dev
```

## Variaveis de ambiente (front/.env) 🔐
Essas variaveis sao usadas pela API serverless em [front/api-src](front/api-src).

```text
MONGO_URI=your_mongo_uri
MONGO_DB=devolucao
JWT_SECRET=algumsegredo
FRONTEND_URL=https://seu-dominio.vercel.app
FRONTEND_URLS=https://seu-dominio.vercel.app,https://seu-preview.vercel.app
DEBUG_ERRORS=false
ENABLE_OVERDUE_JOB=false
```

Notas:
- `FRONTEND_URLS` pode ser lista separada por virgula.
- Para liberar todos os previews, use `FRONTEND_URLS=*`.

## Autenticacao 🔑
- Login em `/api/auth/login` retorna JWT.
- Token e salvo em `sessionStorage` com TTL local de 4 horas.
- O token e enviado via `Authorization: Bearer <token>`.

## Perfis e permissoes 👥
- **Admin**: ve relatorios, gerencia usuarios e pode atualizar protocolo.
- **Loja**: ve apenas suas devolucoes.

## Status das devolucoes 📌
- Admin: `Pendente`, `Solicitado`, `Coletado`, `Concluido`, `Negado`.
- Loja: `Pendente`, `Solicitado`, `Coletado`.

## Lembretes 🔔
Tela dedicada em [front/src/pages/Reminders.jsx](front/src/pages/Reminders.jsx).

Regras:
- **NFD pendente**: aparece quando a devolucao tem 2+ dias e nao possui `nfdNumber` nem `nfdDate`.
- **Sem coleta**: aparece quando a devolucao tem 7+ dias e status nao e `Coletado` ou `Concluido`.

Observacoes:
- Admin ve ambos os tipos.
- Loja ve ambos os tipos.
- Checklist e lixeira persistem por usuario no `sessionStorage`.

## Seed de devolucoes 🌱
Script para inserir devolucoes pendentes no MongoDB:

```bash
cd "C:\Users\User\Desktop\plataforma devolucao\front"
node scripts/seed-returns.mjs
```

## Pontos principais do codigo 🧭
- API client: [front/src/services/api.js](front/src/services/api.js)
- Auth middleware: [front/api-src/middlewares/auth.middleware.js](front/api-src/middlewares/auth.middleware.js)
- Controller de devolucoes: [front/api-src/controllers/returns.controller.js](front/api-src/controllers/returns.controller.js)
- Lembretes (helpers): [front/src/utils/reminders.js](front/src/utils/reminders.js)

## Deploy na Vercel 🚀
- Root Directory: `front`
- Build Command: `npm run build`
- Output: `dist`
- Env vars: configure as mesmas do `.env`

## .env.example 🧪
Arquivo de referencia em [/.env.example](/.env.example). Copie para `front/.env` e preencha.