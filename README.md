# Comissão Pro

Aplicação web para controlar comissões e despesas, agora preparada para rodar no GitHub sem depender do Supabase.

## O que mudou
- Persistência local no navegador via localStorage.
- Autenticação local baseada em email e senha armazenados localmente.
- Esquema SQL em [sql/schema.sql](sql/schema.sql) para migrar depois para um banco relacional.

## Como rodar localmente
```bash
npm install
npm run dev
```

## Deploy no GitHub
1. Crie um repositório no GitHub.
2. Envie o código para o repositório.
3. Conecte o repositório a uma plataforma de hospedagem como Vercel, Netlify ou Cloudflare Pages.
4. Configure o build para usar `npm run build`.

## Banco SQL futuro
O arquivo [sql/schema.sql](sql/schema.sql) define as tabelas para:
- users
- commissions
- expenses

Você pode importar esse schema em PostgreSQL ou Supabase/Neon/Render SQL.

## Próximo passo recomendado
Substituir a persistência local por chamadas HTTP para uma API própria com PostgreSQL.
