# Dog Walk Logger

Aplicativo web para registrar passeios com cães.

## Tecnologias

- `Vite` + `React` + `TypeScript`
- CSS moderno (responsivo, mobile-first)
- i18n simples (EN e PT-BR)
- Persistência em `localStorage`

## Como executar

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Rode o servidor de desenvolvimento:

   ```bash
   npm run dev
   ```

3. Abra no navegador a URL exibida no terminal (por padrão `http://localhost:5173/`).

## Estrutura inicial

- `src/i18n.tsx`: Provedor de idioma e dicionário EN/PT-BR.
- `src/components/Header.tsx`: Header com alternância de idioma.
- `src/components/WalkForm.tsx`: Formulário de registro de passeio.
- `src/styles.css`: Estilos base responsivos.

## Idiomas

- Idioma padrão: `English (en)`.
- Alternância disponível no topo (EN / PT-BR). Todo o texto de UI é traduzível via dicionário.

## Dados

- Os passeios são salvos no `localStorage` em `dwl_walks`.
- Campos: nome do cachorro, data/hora, duração (min), distância (km), rota/local, clima, nível de energia (1–5), notas, foto (opcional).

## Próximos passos

- Dashboard de histórico com filtros e edição/remoção.
- Estatísticas com gráficos e contador de streak.
- Perfis de múltiplos cães.
- Lembretes e alertas.

---

## English

Dog Walk Logger — A web app to log dog walks.

### Tech

- `Vite` + `React` + `TypeScript`
- Modern CSS (responsive, mobile-first)
- Simple i18n (EN and PT-BR)
- Persistence via `localStorage`

### Run

```bash
npm install
npm run dev
```

Open `http://localhost:5173/` in your browser.

### Structure

- `src/i18n.tsx`: Language provider and dictionary EN/PT-BR.
- `src/components/Header.tsx`: Header with language switch.
- `src/components/WalkForm.tsx`: Walk registration form.
- `src/styles.css`: Base responsive styles.

### Data

- Walks saved in `localStorage` (`dwl_walks`). Fields include dog name, datetime, duration, distance, route, weather, energy level (1–5), notes, optional photo.

### Next

- History dashboard with filters and edit/delete.
- Statistics and streak counter.
- Multi-dog profiles.
- Reminders and alerts.
