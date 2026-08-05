# Changelog

All notable changes to this project are documented here.

## 0.1.0

### Added

- Dashboard views for overview, regions, model comparison, methodology, and
  project scope.
- CSV-backed data access with regional, contamination, and water-source
  aggregations.
- Browser-side QSVC estimator using a TypeScript statevector kernel.
- Offline Python script for reproducing the fitted model export.
- Majority-class reference and stratified five-fold SVM comparison.
- Responsive navigation, loading, error, and not-found states.
- Accessible charts, labeled controls, reduced-motion support, and keyboard
  interaction for the mobile drawer.
- Automated unit, component, lint, type-check, and production-build checks.

### Documentation

- Documented the CSV's unverified provenance and repeated community-name rows.
- Documented the separable `RY` feature map and its mathematical limitation.
- Documented the distinction between the live browser estimator and historical
  comparison metrics.

## Current limitations

- The bundled CSV is an assembled proof-of-concept fixture, not verified field
  data.
- The live quantum kernel is simulated classically and uses no quantum
  hardware.
- The QNN comparison does not have a captured final accuracy.
- The estimator is exploratory and must not replace laboratory testing or
  field assessment.
