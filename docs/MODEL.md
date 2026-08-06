# Model configuration

This document records the model configuration exposed by the dashboard. The
values are historical training configuration from the original hackathon
notebook; they are not a claim that the QNN is retrained when this Next.js app
runs.

## Quantum neural network

The QNN configuration in `src/config/model.ts` is:

- 4 qubits
- 3 variational layers
- 100 epochs
- Adam optimizer
- Initial learning rate 0.05 with cosine annealing
- AngleEmbedding for input features
- StronglyEntanglingLayers for the variational circuit
- 4 PCA components
- Batch size 32
- PennyLane framework

The original saved output did not include a final held-out QNN accuracy, so
the dashboard intentionally displays that metric as unavailable.

## Compared models

The dashboard also reports historical comparison metrics for a classical SVM
and a QSVC. Those values come from the saved execution output described in the
source comments and are not recomputed by the dashboard.

The live estimator is a separate QSVC run trained from the current CSV using
the reproducible script and parameters exported to
`src/algorithms/data/qsvcParams.ts`.
