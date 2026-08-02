/**
 * Configuration of the Quantum Neural Network model used to classify water
 * quality, as actually implemented and trained in the original research
 * notebook (PennyLane, variational circuit). These are real hyperparameters,
 * not placeholder/example values - see `docs/MODEL.md` for the full
 * derivation and the notebook this was ported from.
 */
export const QNN_CONFIG = {
  qubits: 4,
  variationalLayers: 3,
  epochs: 100,
  initialLearningRate: 0.05,
  lrSchedule: "cosine-annealing" as const,
  optimizer: "Adam" as const,
  embedding: "AngleEmbedding" as const,
  entanglementStrategy: "StronglyEntanglingLayers" as const,
  framework: "PennyLane" as const,
  pcaComponents: 4,
  batchSize: 32,
} as const;

/**
 * Metrics below are copied directly from the saved execution outputs of
 * models/02_model_training_svm_qsvc_qnn.ipynb in the original project
 * repository (140 train / 60 test samples, 8 features -> PCA to 4 for the
 * quantum models). Not re-estimated, not randomized.
 */
export const COMPARED_MODELS = [
  {
    id: "baseline",
    name: "Majority-class baseline",
    description:
      "Always predicts the most common water-quality class in the current 500-row dataset.",
    accuracy: 0.746,
    metricsNote:
      "373 of 500 rows (74.6%) are class 1. This is the reference point for judging whether a model learns more than the class imbalance.",
  },
  {
    id: "svm",
    name: "Classical SVM",
    description: "Support Vector Machine baseline (scikit-learn), RBF kernel.",
    accuracy: 0.798,
    accuracyStd: 0.0279,
    metricsNote:
      "Mean accuracy +/- standard deviation across 5 stratified folds (79.8% +/- 2.8%). F1, precision, and recall were not computed for this cross-validation run.",
  },
  {
    id: "qsvc",
    name: "Quantum SVC",
    description:
      "Support Vector Classifier with a kernel computed via a quantum feature map.",
    accuracy: 0.8333,
    f1: 0.8214,
    precision: 0.8214,
    recall: 0.8214,
    auroc: 0.8694,
    auprc: 0.8921,
  },
  {
    id: "qnn",
    name: "Quantum Neural Network",
    description: "Variational quantum circuit trained end-to-end with gradient descent.",
    accuracy: null,
    metricsNote:
      "Training ran for 100 epochs (loss dropped from 1.00 to 0.87 by epoch 11) but the final held-out accuracy wasn't captured in the saved notebook output. Shown honestly as unavailable rather than estimated.",
  },
] as const;
