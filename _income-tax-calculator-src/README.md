# Income Tax Calculator — Tax Year 2026-27 (Biz Matrix)

A free computation tool at **bizmatrix.in/income-tax-calculator/**. It computes income tax for Tax Year 2026-27 (1 April 2026 – 31 March 2027) under the Income-tax Act, 2025 as amended by the Finance Act, 2026, for residents:

- **Individual / proprietor and HUF:** one live computation sheet; every line is worked out under the new regime (s.202) and the old regime side by side, with the comparison at the end.
- **Partnership firm / LLP:** partner remuneration and interest limits (s.35(e)), presumptive income (s.58, not for LLPs), AMT.
- **Private / public company:** normal provisions with MAT, or s.200 / s.201.
- **Section 8 company:** registered non-profit organisation (Part XVII-B), or taxed as a company.

Each sheet has a sticky summary bar, quick-jump links, a disclaimer and a print / PDF layout. It is a computation aid, not tax advice.

Moved here on 12 November 2026 from `Desktop/Other Pages-Biz matrix/Income Tax Calculator`.

## Run

```bash
npm install
```

```bash
npm run dev
```

```bash
npm run check
```

`npm run check` runs the type-check, the numeric-literal lint (no statutory number may be written in engine code), the smoke cases, all tests and a build.

```bash
npm run build:site
```

`npm run build:site` runs the check, then writes the static page to `../income-tax-calculator/` (relative paths), which is served at bizmatrix.in/income-tax-calculator/.

## Layout

| Path | What it holds |
|---|---|
| `rules/ty2026-27.json` | Every rate, limit and condition, with section, PDF page and verbatim extract. The engine reads only this file. |
| `rules/RULES_REVIEW.md` | The same rules as a table for the CA to tick (regenerate with `npm run render:review`). |
| `OPEN_QUESTIONS.md` | Points that need a CA ruling, and assumptions adopted meanwhile (rules Z-01 to Z-17). |
| `src/engine/` | Pure TypeScript, money in integer paise: `individual.ts`, `firm.ts`, `company.ts`, `section8.ts`, `presumptive.ts`, `advanceTax.ts`, shared `core.ts`. |
| `src/ui/sheet.ts` | Individual / HUF sheet (new and old regime side by side). |
| `src/ui/entitySheet.ts` | Firm / LLP, company and Section 8 sheet. |
| `src/ui/business.ts` | Shared "business or profession" block (presumptive or books). |
| `src/ui/extras.ts` | Disclaimer text, summary bar, quick-jump links and the print layout. |
| `tests/` | 153 hand-worked cases (`cases.ts`, all "UNVERIFIED — CA to confirm"), property tests, `CASES_REVIEW.md`, and `CROSSCHECK.md` (25 runs against the official CBDT calculator). |
| `reference/` | Source PDFs (Act, Rules, FAQs) and `links.md`. The PDFs are not committed to git (see the site's `.gitignore`). |

## Keeping the law current

1. Change the value in `rules/ty2026-27.json` (with its section, page and extract).
2. Run `npm run check`, then `npm run build:site`, then deploy the site.

## Status

- The rules table and the test cases still need line-by-line confirmation by the CA.
- Open questions that block parts of the computation: Q16 (rate on a registered Section 8 company's regular income), Q27 (marginal relief when a capital gain crosses a threshold), Q2 (Taxation and Other Laws (Amendment) Act, 2026).
- Not covered: non-residents, loss set-off and carry-forward, interest u/s 423 and fee u/s 428, goods-carriage presumption, clubbing, DTAA.
