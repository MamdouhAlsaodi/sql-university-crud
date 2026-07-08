# Apresentação — Notas para conversão

Este deck está em **Markdown** propositalmente. Para gerar PDF/PPTX:

## Opção 1: Pandoc (PDF) — mais rápida

```bash
# Instalar
sudo apt install pandoc texlive-latex-recommended texlive-fonts-recommended

# Gerar PDF
pandoc SLIDES.md -o SLIDES.pdf \
  -t beamer \
  --pdf-engine=xelatex \
  -V theme:metropolis \
  -V colortheme:seahorse \
  --slide-level=1
```

## Opção 2: Marp (slides web/PPTX)

```bash
# Instalar marp-cli
npm install -g @marp-team/marp-cli

# Gerar HTML
marp SLIDES.md -o SLIDES.html

# Gerar PDF
marp SLIDES.md --pdf -o SLIDES.pdf

# Gerar PowerPoint
marp SLIDES.md --pptx -o SLIDES.pptx
```

## Opção 3: Apresentar diretamente em GitHub

O arquivo `SLIDES.md` renderiza nativamente em:
- GitHub: `https://github.com/MamdouhAlsaodi/sql-university-crud/blob/main/presentation/SLIDES.md`
- VSCode: com extensão "Markdown Preview Enhanced"

A separação `---` cria slides automaticamente.

## Opção 4: Impress → PDF (sem dependências extras)

Abra `SLIDES.md` em qualquer editor Markdown com preview, escolha
"Print → PDF" no Chrome, e use page-size "Presentation (16:9)".

---

## Cronograma recomendado (5 min)

| Tempo | Slide | Conteúdo |
|---|---|---|
| 0:00 | 1 | Capa |
| 0:30 | 2-3 | Objetivo + domínio |
| 1:00 | 4-5 | Modelagem + constraints |
| 2:00 | 6-7 | Arquitetura + conexão |
| 2:30 | 8 | Demo ao vivo |
| 4:00 | 9-11 | Relatórios + decisões |
| 4:30 | 12-13 | Como rodar + conclusão |