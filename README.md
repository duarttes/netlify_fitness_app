# Tracker Matheus - Deploy no Netlify

## Rodar localmente
```bash
npm install
npm run dev
```

## Build
```bash
npm run build
```

## Deploy no Netlify
1. Suba esta pasta para um repositório no GitHub.
2. No Netlify, clique em **Add new site** > **Import an existing project**.
3. Escolha o repositório.
4. O Netlify deve detectar automaticamente:
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Deploy.

## Observação
Os dados ficam salvos no navegador do aparelho usando localStorage.
Se limpar os dados do navegador, o histórico some.
