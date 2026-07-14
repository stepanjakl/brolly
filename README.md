# brolly ☂️

A small weather dashboard application. Search for cities, pin them, and
see their current weather at a glance. Built with Next.js 16, React Aria
Components and Tailwind CSS 4.

## Getting started

```bash
npm install
cp .env.example .env.local   # add your OpenWeather API key
npm run dev                  # → http://localhost:3000
```

You'll need a free [OpenWeather API key](https://home.openweathermap.org/api_keys)
(new keys can take a couple of hours to activate).

Other scripts: `npm test`, `npm run lint`, `npm run typecheck`,
`npm run format`, `npm run build && npm start`.

## How it works

```
app/         routes - the page shell and the API proxy routes
components/  UI (search, cards, detail sheet, unit toggle)
hooks/       stateful logic
lib/         pure functions - where most of the tests live
```

- The browser never talks to OpenWeather directly; two route handlers
  proxy it and the API key stays server-side.
- Upstream responses are cached on the server (10 min for weather, 24 h
  for geocoding) and shared across all visitors, which keeps usage well
  inside the free tier.
- Cities are stored as coordinates in localStorage. Weather is fetched
  once, in metric; the °C/°F toggle converts at render time, so switching
  units costs no API calls.

Weather data by [OpenWeather](https://openweathermap.org). Typeface is
[Open Runde](https://github.com/lauridskern/open-runde) (SIL OFL 1.1).
