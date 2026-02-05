# Projeto web_03mb — Backend + Frontend

Este repositório contém um backend em Node.js (Express + SQLite) e um frontend estático com 3 páginas (Home, Lista de produtos, Cadastrar produto).

Como rodar localmente

1. Backend

```bash
cd backend
npm install
npm start
```

O servidor iniciará em `http://localhost:3000` e servirá também os arquivos da pasta `frontend`.

  

2. Frontend

Abra `http://localhost:3000` no navegador. As páginas:
- `/` — Home
- `/products.html` — Lista de produtos (consome `GET /api/products`)
- `/add.html` — Formulário para cadastrar (envia `POST /api/products`)

Criar repositório remoto (GitHub)

```bash
git init
git add .
git commit -m "Initial commit: backend + frontend"
# criar repo no GitHub e adicionar remote
git remote add origin https://github.com/SEU_USUARIO/NOME_REPO.git
git push -u origin main
```

Depois, envie o link do repositório aqui para eu conferir.
