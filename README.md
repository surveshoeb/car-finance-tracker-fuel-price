# car-finance-tracker-fuel-price

A tiny, free, static cache of a reference petrol price for the
[Car Finance Tracker](../Car-Finance-Tracker) app's EV savings calculation.

**This repo must be public.** That's the whole point of it existing
separately from the main (private) app repo — `raw.githubusercontent.com`
only serves files without authentication for public repos, and GitHub
Pages requires a paid plan for private repos on personal accounts. Keeping
this repo tiny and public costs nothing and reveals nothing sensitive (it's
just a scraper script and a price number).

## What it does

A scheduled GitHub Actions workflow (`.github/workflows/fetch-price.yml`)
runs twice a day, scrapes a public petrol-price page
(`scripts/fetch-price.js`), and commits the result to
`data/fuel-price.json`. The app fetches that file directly over HTTPS —
no API key, no server, no billing account anywhere.

## Setup (one-time)

1. Create a new **public** GitHub repo (e.g. named
   `car-finance-tracker-fuel-price`) and push everything in this folder to
   it.
2. In the new repo's **Settings → Actions → General**, make sure Actions
   are enabled (they are by default) and that workflows have
   **read and write permissions** (Settings → Actions → General →
   Workflow permissions) — needed for the workflow to commit the updated
   JSON file back.
3. Go to the **Actions** tab, select "Fetch fuel price," and click
   **Run workflow** once manually — don't wait for the twice-daily
   schedule for the first data. This replaces the placeholder value in
   `data/fuel-price.json` (seeded with a dummy `100.0` so the app has
   *something* to parse before the first real run) with a real scraped
   price.
4. Confirm it worked: open
   `https://raw.githubusercontent.com/<your-username>/car-finance-tracker-fuel-price/main/data/fuel-price.json`
   in a browser and check the price looks sane.
5. Update `_sourceUrl` in the main app repo's
   `lib/data/services/fuel_price_service.dart` with that exact URL
   (replace `REPLACE_ME` with your GitHub username).

## Maintenance

- GitHub disables scheduled workflows on a repo after **60 days with no
  commits** — if the price stops updating after a couple of months of
  otherwise-untouched history, check the Actions tab and click
  "Re-enable workflow." This is a free-tier housekeeping quirk, not a
  cost.
- If the scraped price ever looks wrong or the workflow starts failing,
  `goodreturns.in`'s page structure probably changed — see the comment at
  the top of `scripts/fetch-price.js` for how to debug it (run locally
  with `DEBUG=1 node scripts/fetch-price.js` to print the fetched HTML).
  Only this one script needs a fix; the app itself doesn't need an update
  since it just reads whatever JSON shape `fuel-price.json` currently has
  (as long as the field names stay `pricePerLiter`/`updatedAt`/`source`).
