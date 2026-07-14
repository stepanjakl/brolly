# brolly ☂️

A small weather dashboard application. Search for cities, pin them, and
see their current weather at a glance. Built with Next.js 16, React Aria
Components and Tailwind CSS 4.

## Getting started

```bash
npm install
cp .env.example .env.local   # add your OpenWeather API key
npm run dev                  # → https://brolly.localhost
```

You'll need a free [OpenWeather API key](https://home.openweathermap.org/api_keys)
(new keys can take a couple of hours to activate). Dev serves over
`https://brolly.localhost` via [portless](https://portless.sh); if you'd
rather skip that, `npm run dev:plain` runs the stock server on
`http://localhost:3000`.

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

## Approach

The rate limit shaped most of my decisions. 1,000 calls a day isn't much, so
the first thing I settled on was that the browser should never call
OpenWeather directly. Instead there are two small Next.js API routes that
proxy the requests, keep the key on the server, and cache the responses (10
minutes for weather, a day for city lookups, since cities don't move). That
caching happens in Next's data cache and is shared across everyone, so it
doesn't matter how many people open the app; the number of upstream calls
stays roughly the same. Each card also shows when its data was last fetched,
so the caching is honest rather than pretending everything is live.

From there I worked from the inside out: the pure logic first with tests
(unit conversion, the condition-to-icon mapping, the storage layer), then the
API routes, then localStorage, then the UI (search, cards, detail view), with
polish last. That way the core was solid before I spent time on the visuals.

A few technical choices worth calling out:

- Each card fetches its own weather with SWR, so it has its own loading and
  error state and one city failing never takes the whole board down. SWR also
  dedupes requests, so the card and its detail view share a single call.
- Cities are stored by coordinates rather than name, which sidesteps the
  "which Newcastle?" problem and keeps the cache keys unambiguous. They persist
  in localStorage, read through useSyncExternalStore so the store itself is the
  source of truth and two tabs stay in sync for free.
- Weather is fetched once in metric and the °C/°F toggle converts on the
  client, so switching units costs no extra API calls.
- Search and the detail sheet use React Aria Components for proper keyboard
  and screen-reader behaviour, with Tailwind for the styling on top.
- The weather icons are emoji, and the card gradient is picked from both the
  condition and the time of day in that city, with the colours constrained so
  the text always stays readable.

What you end up with is a dashboard where you search for a city, pin it, and
get a card showing the current weather and roughly what time of day it is
there.

A note on process: I used AI as a tool while building this, mostly for
scaffolding and test cases, and reviewed and made the call on every decision
myself.

Weather data by [OpenWeather](https://openweathermap.org). Typeface is
[Open Runde](https://github.com/lauridskern/open-runde) (SIL OFL 1.1).
