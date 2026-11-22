# Biblioflix — Plataforma de Leitura Digital por Assinatura

MVP completo desenvolvido com React, TypeScript, Vite, Tailwind CSS, React Router, Node.js, Express, Zod, Prisma ORM e SQLite.

## Pré-requisitos
- Node.js >= 20
- npm >= 10

## 1. Instalação Local

1. Instale todas as dependências:
```bash
npm run install:all
```

2. Crie os arquivos `.env` a partir dos exemplos:
```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```
*(No Windows PowerShell, use `copy server\.env.example server\.env` e `copy client\.env.example client\.env`.)*

## 2. Banco de Dados e Seed

```bash
npm run db:generate
npm run db:push
npm run db:seed
```

### Contas de Demonstração (Seed)
- **Administrador (`ADMIN`)**: `admin@biblioflix.com` / `Admin1234`
- **Leitor (`USER`, plano Gratuito)**: `marina@email.com` / `Marina1234`

## 3. Execução em Desenvolvimento

```bash
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3333`
- Healthcheck API: `http://localhost:3333/api/health`
- Diagnóstico Frontend: `http://localhost:5173/setup`
- Demonstração de Componentes: `http://localhost:5173/componentes`

## 4. Build de Produção

```bash
npm run build
NODE_ENV=production npm --prefix server run start
```

## 5. Observações Importantes
- Os pagamentos operam com `SimulatedPaymentProvider` (cartão final `4242` aprova; final `0002` recusa). Números completos de cartão e CVV nunca são armazenados.
- **Capas reais:** com internet, rode `npm run db:covers`. O script busca cada livro na Open Library e grava no banco a URL da capa (`covers.openlibrary.org`); as imagens não são baixadas, o navegador as carrega de lá. Use `npm run db:covers -- --force` para substituir capas já definidas e `npm run db:covers -- --reset` para voltar às ilustrações locais.
- **Capas locais (fallback):** ilustrações originais em SVG em `client/public/assets/covers/<slug>.svg`. Elas aparecem automaticamente para livros sem capa, mesmo sem rodar o seed de novo. Para usar uma imagem sua, coloque o arquivo nessa pasta e informe `/assets/covers/arquivo.jpg` em `coverUrl` pelo painel admin.
- O logo e o favicon ficam em `client/public/assets/branding/` e `client/public/favicon.svg`.
