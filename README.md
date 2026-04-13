# Matheus Tracker v13

## Novidades
- refeições padrão: café da manhã, almoço, lanche, janta e ceia
- editar/renomear/adicionar/remover slots de refeição
- inteligência para preencher macros automaticamente
- parser simples para entradas como:
  - `1 ovo cozido`
  - `2 ovos`
  - `banana 120g`
  - `arroz 100g`
- fallback manual quando não achar o alimento

## Rodar
```bash
npm install
npm run dev
```

## Configurar
1. Copie `.env.example` para `.env`
2. Preencha URL e anon key do Supabase
3. Rode `supabase/schema_v13.sql` no SQL Editor
