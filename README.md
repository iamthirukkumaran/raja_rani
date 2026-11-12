# Raja Rani — marketing site

A single-page site for **Raja Rani**, the classic Indian party card game rebuilt for
phones. One room, one six-letter code, five secret roles — the Police has to find
the Thief.

**Live:** https://iamthirukkumaran.github.io/raja_rani/

## Running it

No build step and no dependencies. Open `index.html`, or serve the folder:

```bash
python3 -m http.server 8000
```

## Structure

| Path | What it is |
| --- | --- |
| `index.html` | The whole page |
| `privacy.html` | Privacy policy — the URL the App Store and Play Console ask for |
| `legal.css`, `legal.js` | Styles and behaviour for the policy page only |
| `styles.css` | Tokens, layout, components, responsive and reduced-motion rules |
| `app.js` | Scroll reveal, the 3D card flip, podium counters, pointer tilt |
| `assets/img/` | Web-ready WebP art (characters, props, backgrounds, card back) |
| `assets/*.jpeg` | The original source art, unprocessed |

The character and prop art arrived on white backgrounds; `assets/img/` holds
cut-out WebP versions with real transparency so they sit on the dark palace
background.

## Design notes

- **Type:** Cinzel for titles, Plus Jakarta Sans for everything else.
- **Palette:** night purple `#22073A`, royal purple `#3A1460`, gold `#F5C04A`,
  ivory `#FBF6EA`.
- **Motion:** strong custom curves (`cubic-bezier(0.23, 1, 0.32, 1)` for entrances,
  `cubic-bezier(0.77, 0, 0.175, 1)` for the card flip). Press feedback stays under
  160ms; UI motion stays under 300ms.
- **Accessibility:** `prefers-reduced-motion`, `prefers-reduced-transparency` and
  `prefers-contrast` are all handled, every hover is gated behind
  `(hover: hover) and (pointer: fine)`, and the page reads fine with JavaScript off.

## Still to do

- The store buttons are `#` placeholders pending the App Store and Play Store listings.
- Terms of service is not written yet; the app's Settings screen links to it.
- Sample names, codes and scores in the mock screens are illustrative, not real data.
