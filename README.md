# Método FMB · Plano de Estudos

Sistema web para estudar para concursos pelo método do Prof. Flávio Monteiro de Barros:
grade semanal fixa, cada sessão dividida em **revisão acumulada (½)** + **aula nova (½)**,
checklist do estudo (ler até mentalizar · 2× sem olhar · perguntas escritas), caderno de anotações
e revisão veloz (~10 s por aula). Vem com o plano-modelo **PGM Curitiba 2026** e permite criar novos
planos a partir do **edital** e da **última prova** (PDF ou texto).

## Publicar na Vercel

**Pelo site (mais simples)**
1. Crie um repositório no GitHub e envie o conteúdo desta pasta (ou arraste a pasta em vercel.com/new).
2. Em vercel.com → *Add New → Project* → importe o repositório.
3. Framework Preset: **Other**. Sem build command, sem output directory. Clique em **Deploy**.

**Pela linha de comando**
```bash
npm i -g vercel
vercel          # primeira vez (preview)
vercel --prod   # produção
```

## Análise com IA (opcional)

Sem configuração nenhuma, o app já lê os PDFs no navegador e faz a análise automática.
Para habilitar o botão **✨ Analisar com IA** (mais preciso em editais com formatação difícil):

- Vercel → Project → *Settings → Environment Variables* → `ANTHROPIC_API_KEY` = sua chave da API da Anthropic.
- Opcional: `ANTHROPIC_MODEL` (padrão `claude-sonnet-5-5`).
- Faça um novo deploy. A chave fica só no servidor (função `api/plano.js`); o navegador nunca a vê.

## Estrutura

```
lib/docx.iife.js      gerador de Word (carregado só ao exportar .docx)
index.html            app completo (HTML + CSS + JS, sem dependências além do pdf.js via CDN)
api/plano.js          função serverless opcional (análise com IA)
vercel.json           configuração da Vercel
src/index.src.html    fonte do app (com marcador do plano-modelo)
src/template-pgm.json matérias e tópicos do plano-modelo
build.py              regenera index.html a partir de src/ (só se editar os fontes)
```

## Dados

Plano, marcações e caderno ficam no `localStorage` do navegador de cada pessoa — nada vai para servidor.
Use **💾 Dados → Exportar** para backup ou para levar para outro aparelho. O importador também aceita o
JSON da versão anterior ("PGM · Organizada até passar").
