# Contributing

## Setup

```bash
npm install
npm run dev
```

## Before submitting a PR

```bash
npm run lint
npm run test
npm run build
```

All three must pass. CI will enforce this automatically.

## Principles this project holds to

- **Traceable results.** Every number shown in the dashboard must trace back
  to the checked-in CSV (`data/ghana_water_quality_data.csv`) or a real,
  reproducible computation. If a metric isn't available, say so explicitly
  rather than estimating or randomizing a plausible-looking value.
- **No dead code.** If you replace a file's functionality, delete the old
  file in the same PR - don't leave orphaned duplicates.
- **Type safety.** Avoid `any`; prefer explicit interfaces (see
  `src/algorithms/types.ts` conventions where applicable).
