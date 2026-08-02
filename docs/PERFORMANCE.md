# Performance Notes

## Bundle size (measured, not estimated)

Verified by starting a real production build (`npm run build && npm start`)
and diffing the actual `<script>` tags served for different routes:

| Route                                  | Total JS chunks loaded                                 |
| -------------------------------------- | ------------------------------------------------------ |
| `/` (Overview - has 2 Recharts charts) | 11 chunks, incl. `0yt1hwcj-ubli.js` (396KB - Recharts) |
| `/about` (no charts)                   | 10 chunks - **`0yt1hwcj-ubli.js` is NOT loaded**       |

This confirms Next.js App Router's automatic per-route code splitting is
working as intended here: Recharts (the single largest dependency in the
bundle) is only shipped to visitors of the Overview page, not to every
page in the app. No manual `dynamic()` lazy-loading was needed since only
`page.tsx` imports the chart components - they aren't imported by the
shared dashboard layout.

Total JS across all chunks: ~1.1MB (uncompressed, across every route
combined - no single page loads all of it at once per the table above).

## Known gaps (not yet done)

- No formal Lighthouse/PageSpeed run - `@axe-core/cli` (which bundles a
  headless Chrome) could not be installed in the sandbox this was built
  in (network egress restricted to a domain allowlist that excludes
  `googlechromelabs.github.io`). Worth running `npx lighthouse` locally
  or via GitHub Actions with full network access.
- No image optimization audit - the app currently has no `<img>`/`next/image`
  usage at all (no photos/screenshots embedded yet), so this isn't
  applicable yet but will be once visuals are added (e.g., a map).
- Server-side dataset parsing (`services/waterQualityData.ts`) re-parses
  the CSV on cold start but is not cached across requests in a
  multi-instance deployment (e.g., serverless functions that don't share
  memory). Fine for a single Vercel instance/edge function under normal
  load; would need a real cache layer (Redis, or a build-time JSON
  precompute step) at higher scale.
