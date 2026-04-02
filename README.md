# Tracker Matheus - versão Netlify v2

## O que mudou
- registro de água em doses ao longo do dia
- salva data e horário de cada registro
- gráfico de água acumulada no dia
- boneco que preenche conforme a água aumenta
- meta de água automática: 35 ml por kg

## Rodar localmente
```bash
npm install
npm run dev
```

## Build
```bash
npm install
npm run build
```

## Deploy no Netlify
1. Suba esta pasta para um repositório no GitHub.
2. No Netlify, clique em **Add new site**.
3. Escolha **Import an existing project**.
4. Selecione o repositório.
5. O Netlify deve detectar automaticamente:
   - Build command: `npm run build`
   - Publish directory: `dist`
6. Clique em deploy.

## Como atualizar depois
### Opção simples
- edite os arquivos
- faça commit e push no GitHub
- o Netlify publica sozinho

### Arquivos mais importantes
- `src/App.jsx` -> lógica do app
- `src/styles.css` -> visual
- `package.json` -> dependências
- `netlify.toml` -> configuração do deploy

## Observação
Os dados ficam salvos no navegador do aparelho (localStorage). Se limpar os dados do navegador, apaga os registros.
