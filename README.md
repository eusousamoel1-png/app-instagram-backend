# 📸 InstaAutoPost — powerencapsulados

Sistema de automação de postagens para o Instagram usando IA (OpenAI) e API oficial do Meta.

## 🚀 Funcionalidades

- **Login OAuth** com Instagram via API do Meta
- **Geração de conteúdo com IA** — DALL-E 3 (imagens) + GPT-4o (legendas + hashtags)
- **Agendamento de posts** com calendário visual
- **Publicação automática** no horário agendado via Instagram Graph API
- **Controle de rate limits** automático (máx. 25 posts/dia)
- **Dashboard** com estatísticas e gestão de posts

## 📋 Pré-requisitos

1. **Node.js** >= 18
2. **App Meta** configurado (`power`, ID: `1019033761105270`)
3. **Conta Instagram Business** (`@powerencapsulados`) vinculada a uma Página do Facebook
4. **Projeto Firebase** (`app-postagem-instagram`) com Firestore habilitado
5. **OpenAI API Key** (para DALL-E 3 e GPT-4o)

## ⚙️ Configuração

### 1. Clonar e instalar
```bash
# Instalar dependências do servidor
cd server
npm install

# Instalar dependências do cliente
cd ../client
npm install
```

### 2. Configurar variáveis de ambiente
```bash
# Na pasta server/
cp ../.env.example .env
# Edite o arquivo .env com suas credenciais
```

### 3. Firebase
- Acesse o [Firebase Console](https://console.firebase.google.com)
- Projeto: `app-postagem-instagram`
- Ative o **Firestore Database** em modo de produção
- Vá em **Configurações > Contas de serviço > Gerar nova chave privada**
- Salve o arquivo como `server/firebase-service-account.json`

### 4. Meta for Developers
- App: `power` (ID: `1019033761105270`)
- Em **Configurações > Básico**: copie o `App Secret` para o `.env`
- Em **Produtos > Login do Facebook**: adicione `http://localhost:3001/auth/callback` como URI de redirecionamento
- Permissões necessárias: `instagram_basic`, `instagram_content_publish`, `pages_show_list`, `pages_read_engagement`

## 🏃 Executar

### Desenvolvimento
```bash
# Terminal 1 — Servidor (porta 3001)
cd server
npm run dev

# Terminal 2 — Cliente (porta 5173)
cd client
npm run dev
```

Acesse: **http://localhost:5173**

### Produção (Firebase Hosting)
```bash
cd client
npm run build

# Instalar Firebase CLI
npm install -g firebase-tools
firebase login
firebase deploy
```

## 🏗️ Estrutura do Projeto

```
├── client/                    # Frontend React (Vite)
│   ├── src/
│   │   ├── components/        # Componentes reutilizáveis
│   │   ├── contexts/          # React Context (Auth)
│   │   ├── pages/             # Páginas (Login, Dashboard, Generate, Schedule)
│   │   └── services/          # API client + Firebase config
│   └── package.json
│
├── server/                    # Backend Node.js (Express)
│   ├── src/
│   │   ├── middleware/        # Rate limiter, Auth
│   │   ├── routes/            # auth, content, posts
│   │   └── services/          # Instagram, OpenAI, Firebase, Scheduler
│   └── package.json
│
├── .env.example               # Template de variáveis de ambiente
└── README.md
```

## ⚠️ Rate Limits

| Limite | Valor | Ação |
|--------|-------|------|
| Posts/dia (Instagram) | 25 | Bloqueio automático |
| Chamadas API/hora (Meta) | 200 | Rate limiter no Express |
| Token de acesso | 60 dias | Refresh manual via OAuth |
| DALL-E (OpenAI) | Depende do plano | Retry com backoff |

## 📝 Licença

Projeto privado — powerencapsulados © 2026
