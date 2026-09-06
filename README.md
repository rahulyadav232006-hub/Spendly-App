# Spendly

A simple weekly expense & budget tracker. Open it, see what's left this week, add an expense in seconds.

Built with Next.js 14 (App Router), TypeScript, Tailwind CSS, Recharts, and IndexedDB for local-first, offline-friendly storage. Installable as a PWA on your phone's home screen.

## Run it locally

Requires [Node.js](https://nodejs.org) 18 or newer.

```bash
npm install
npm run dev
```

Then open http://localhost:3000 in Chrome or Edge (for voice input to work — see note below).

## Build for production

```bash
npm run build
npm start
```

## Deploy so you can install it on your phone

The easiest free option is [Vercel](https://vercel.com):

1. Push this folder to a new GitHub repository.
2. Go to vercel.com → "Add New Project" → import that repo.
3. Leave all settings as default (Vercel auto-detects Next.js) and click Deploy.
4. Open the resulting `https://your-project.vercel.app` URL on your phone.
5. In Chrome (Android) you'll see an "Install app" prompt or a menu option "Add to Home screen". In Safari (iOS), use the Share button → "Add to Home Screen".

Once installed, Spendly opens full-screen like a native app and keeps working offline after the first visit, thanks to the service worker in `public/sw.js`.

## Project structure

```
app/                 Next.js App Router pages, layout, global styles
components/          UI components (Dashboard, Insights, Transactions, modals, nav, ...)
hooks/               useSpendlyStore — the app's state + persistence hook
services/db.ts       IndexedDB read/write layer (no external dependency)
lib/                 Constants, date/money utilities, quick-prompt parser, sample data
types/               Shared TypeScript types
public/              manifest.json, service worker, app icons
```

## Notes & known limitations

- **Voice entry** uses the browser's built-in `SpeechRecognition` API (Chrome/Edge/Safari only — Firefox has no support). It always shows a confirmation screen before saving, and falls back to Quick Prompt if the mic is unavailable or denied.
- **Data lives in IndexedDB**, scoped to the browser/device you use. It doesn't sync across devices — Export/Import in Settings lets you move a JSON snapshot manually.
- **Currency formatting** uses `Intl.NumberFormat`; amounts are summed using integer-cent math (see `lib/utils.ts`) to avoid floating-point rounding drift.
- The first time you open the app with an empty database, it seeds a few sample transactions so the UI isn't blank — these are fully editable/deletable, and "Delete All Data" in Settings clears everything (including samples) for a fresh start.
- Categories are currently fixed to the 8 built-in ones (Food, Travel, Shopping, Education, Entertainment, Bills, Health, Other). Adding fully custom user-defined categories is a natural next step if you want it — the `Category` type already supports a `custom` flag for this.
