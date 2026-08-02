# QleanFlow Water Risk

QleanFlow Water Risk is a focused dashboard for exploring water-contamination
risk indicators in Ghanaian communities affected by small-scale mining.

The application combines a transparent data pipeline with an interactive
browser-side QSVC estimator. It is designed as a research and portfolio
project: the results help explain which indicators are associated with higher
risk, but they do not replace laboratory testing or field assessment.

## Highlights

- Regional overview of contamination indicators
- Community and water-source summaries
- Contamination-type and regional comparison charts
- Interactive QSVC risk estimator running in the browser
- Model comparison view with a majority-class reference
- Responsive layout for desktop and mobile screens
- Automated linting, type checking, tests, and production builds

## Data and model scope

The dashboard uses the checked-in
`data/ghana_water_quality_data.csv` file with 500 labeled rows covering 16
regions and 18 model features. The repository does not contain a verifiable
external collection record for the CSV. An audit found 268 distinct community
names; 232 rows repeat an existing name with different measurements. The
dataset is therefore treated as an assembled proof-of-concept fixture, not as
verified field data.

The live estimator is a Quantum Support Vector Classifier (QSVC). Its
four-dimensional kernel uses an explicit statevector simulation implemented in
TypeScript and runs client-side on each input change. No quantum hardware is
required. The current feature map uses single-qubit `RY` rotations without
entangling gates, so the resulting kernel is separable; this limitation is
documented in `docs/MODEL.md`.

The checked-in model comparison reports:

| Reference | Accuracy | Notes |
| --- | ---: | --- |
| Majority class | 74.6% | 373 of 500 labeled rows |
| Classical SVM | 79.8% ± 2.8% | Stratified five-fold cross-validation |
| QSVC | 78.0% | Fixed hold-out evaluation used by the browser estimator |
| QNN | Not captured | Historical reference only |

These figures are intended for transparent comparison. They should not be
interpreted as a validated production model or as evidence of causal impact.

## Technology

- Next.js and React
- TypeScript
- Tailwind CSS
- Recharts
- Vitest and Testing Library
- Python, pandas, NumPy, and scikit-learn for offline model preparation

## Getting started

### Requirements

- Node.js 20 or newer
- npm
- Python 3.10 or newer for model retraining only

### Install and run

```bash
npm install
npm run dev
```

Open the local development URL shown by Next.js.

### Quality checks

```bash
npm run lint
npx tsc --noEmit
npm run test
npm run build
```

### Recreate the QSVC export

```bash
pip install numpy pandas scikit-learn
python scripts/train_qsvc_model.py
```

The script prints the majority baseline, cross-validated SVM metrics, and the
QSVC hold-out result before writing the fitted export used by the browser
implementation.

## Project structure

```text
data/                 Checked-in water-quality CSV
docs/                 Model and performance notes
notebooks/            Reproducible exploration notebook
scripts/              Offline model preparation
src/algorithms/       QSVC pipeline and quantum-kernel simulation
src/components/       Dashboard and shared UI components
src/services/         CSV loading and aggregations
src/app/              Application routes and layouts
```

## Responsible use

QleanFlow Water Risk is an exploratory software project. It must not be used
as the sole basis for public-health decisions, environmental enforcement,
medical advice, or infrastructure investment. Field sampling, laboratory
analysis, local expertise, and appropriate validation are required before any
real-world action.

## License

MIT