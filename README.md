# Scheme Finder

A government scheme eligibility finder. Users answer what they know (all questions are optional) and the site shows:

- **You likely qualify**: every rule is met.
- **Might qualify**: nothing fails yet, but some answers are missing (it lists what is still needed).
- **Almost eligible**: exactly one rule fails, and it tells the user which one.
- **Not eligible**: hidden by default, with reasons.

Other features: asks the most useful unanswered question next, document checklist per scheme, English / हिन्दी / తెలుగు, runs fully in the browser (no data leaves the device), works on mobile.

> **The scheme data in `schemes.js` is sample data with simplified rules.** Before real users rely on it, check every scheme against its official source and fill in `lastVerified`.

## Run it

You need [Node.js](https://nodejs.org) 16 or newer. There is nothing to install.

```bash
npm start        # open http://localhost:3000
npm test         # runs the eligibility engine tests
```

Port busy? Use `PORT=3001 npm start` (Mac/Linux) or `set PORT=3001 && npm start` (Windows cmd).

You can also just double-click `index.html`; it works without the server.

## Put it on GitHub and publish it (GitHub Pages)

1. Create an empty repository on github.com (for example `scheme-finder`). Do not add a README there.
2. In this folder, run:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/scheme-finder.git
git push -u origin main
```

3. On GitHub: **Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: `main`, folder `/ (root)` → Save.**
4. After a minute your site is live at `https://YOUR-USERNAME.github.io/scheme-finder/`.

## Add or change a scheme

Edit `schemes.js`. Each scheme looks like this:

```js
{
  id: "pm-kisan",
  name: "PM-KISAN",
  level: "Central",          // or "State"
  state: null,               // or "Telangana" for state schemes
  topic: "Agriculture",
  benefit: "What the scheme gives.",
  rules: [
    { field: "occupation", op: "eq", value: "farmer", label: "Must be a farmer" },
    { field: "age", op: "between", value: [18, 40], label: "Age must be between 18 and 40" },
  ],
  documents: ["Aadhaar card"],
  url: "https://official-site.gov.in",
  lastVerified: "2026-11-01",   // set this once you have checked the official source
}
```

- Operators: `eq`, `in`, `gte`, `lte`, `between` (inclusive), `is` (true/false).
- For "either of these", use `{ anyOf: [rule, rule], label: "..." }`.
- Every rule needs a `label`; it is what the user sees as the reason.
- Run `npm test` after editing. It checks that every scheme is well-formed.

To add a new question (for example "marital status"), add it to `FIELDS` in `schemes.js`, add its label `f_<key>` to each language in `i18n.js`, and use it in rules.

## Files

| File | What it does |
| --- | --- |
| `index.html`, `style.css` | Page and styling |
| `app.js` | Form, results, language switch |
| `engine.js` | Eligibility logic (pure functions, tested) |
| `schemes.js` | Scheme data and the question list |
| `i18n.js` | English, Hindi and Telugu interface text |
| `test.js` | Engine tests (`npm test`) |
| `server.js` | Small local web server (`npm start`) |

## Ideas for next steps

Translate scheme names and benefits, add a WhatsApp or SMS front end, add deadline alerts, add a "why am I not eligible" explainer, and load the scheme list from a JSON file or API so non-developers can update it.


Auto-deploy test
