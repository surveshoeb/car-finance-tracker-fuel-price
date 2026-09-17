// Scrapes goodreturns.in's petrol-price page for a headline "today's
// price" figure and writes data/fuel-price.json. Deliberately regex-based
// against the page's plain text rather than pinned to specific CSS
// selectors/classnames — those are far more likely to change than the
// basic "Rs. NNN.NN" pattern the page uses, and a text-based match degrades
// more gracefully (worst case: picks up a nearby price from the same page
// rather than throwing outright).
//
// If this stops finding a match, the page structure likely changed —
// re-run with DEBUG=1 to print the fetched text and adjust the regex/
// keyword below. This script intentionally does NOT fail the whole
// workflow run hard on a miss: it exits non-zero so the Action shows red,
// but never commits garbage data over a previously-good file.

const fs = require('fs');
const path = require('path');

const SOURCE_URL = 'https://www.goodreturns.in/petrol-price.html';
const OUTPUT_PATH = path.join(__dirname, '..', 'data', 'fuel-price.json');

// Matches "Rs 111.21", "Rs. 111.21", "₹111.21", "₹ 111.21".
const PRICE_PATTERN = /(?:₹|Rs\.?)\s*(\d{2,3}\.\d{1,2})/i;

async function main() {
  const res = await fetch(SOURCE_URL, {
    headers: {
      // Some sites serve a stripped-down page to non-browser user agents.
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
    },
  });
  if (!res.ok) {
    throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
  }
  const html = await res.text();

  if (process.env.DEBUG) {
    console.log(html.slice(0, 5000));
  }

  // Look for a price near the word "petrol" first (the headline figure),
  // falling back to the first price anywhere on the page.
  const petrolIndex = html.toLowerCase().indexOf('petrol');
  const nearPetrol = petrolIndex >= 0 ? html.slice(petrolIndex, petrolIndex + 2000) : html;
  const match = PRICE_PATTERN.exec(nearPetrol) || PRICE_PATTERN.exec(html);

  if (!match) {
    throw new Error('Could not find a price on the page — site structure likely changed.');
  }

  const pricePerLiter = parseFloat(match[1]);
  const payload = {
    pricePerLiter,
    updatedAt: new Date().toISOString(),
    source: 'goodreturns.in',
  };

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(payload, null, 2) + '\n');
  console.log('Wrote', OUTPUT_PATH, payload);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
