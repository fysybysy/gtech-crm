# G-TECH CRM

CRM zbudowany w React + Vite z Firebase Firestore jako bazą danych.

## Wymagania

- Node.js 18+
- npm

## Uruchomienie lokalne

```bash
npm install
npm run dev
```

Otwórz http://localhost:5173

## Build na GitHub Pages

```bash
npm run build
```

Folder `dist/` wgraj na gałąź `gh-pages` lub skonfiguruj GitHub Actions.

### GitHub Actions (automatyczny deploy)

Utwórz plik `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm install
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

## Struktura projektu

```
src/
  components/
    Dashboard.jsx       # Pulpit główny
    ClientsTable.jsx    # Lista klientów z filtrowaniem
    MeetingPanel.jsx    # Panel nowego spotkania
    ClientForm.jsx      # Modal dodaj/edytuj klienta
    ClientDetail.jsx    # Modal szczegółów klienta
    StageBadge.jsx      # Badge etapu
    Modal.jsx           # Bazowy komponent modalu
    Toast.jsx           # Powiadomienia
  hooks/
    useClients.js       # Hook Firebase
    useToast.js         # Hook powiadomień
  firebase.js           # Konfiguracja Firebase
  utils.js              # Stałe i helpers
  App.jsx               # Root komponent
  main.jsx              # Entry point
```
