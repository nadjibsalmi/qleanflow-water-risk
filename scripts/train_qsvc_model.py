"""
Trains a real Quantum Support Vector Classifier (QSVC) on the Ghana water
quality dataset, using the exact same quantum feature map as the original
project's notebook (models/02_model_training_svm_qsvc_qnn.ipynb):

  - PCA to 4 components, MinMaxScaler to [0, pi]
  - AngleEmbedding (RY rotation per qubit) on 4 qubits
  - Quantum kernel = fidelity |<psi(x1)|psi(x2)>|^2 between the two
    feature-mapped quantum states

This script implements the quantum kernel via a REAL statevector
simulation (explicit 2^4=16-dimensional complex state, gates applied via
tensor products) rather than PennyLane, so the exact same simulator logic
can be ported to TypeScript and cross-verified for an exact match.

Run: pip install pandas scikit-learn numpy
     python scripts/train_qsvc_model.py
"""

import json
import numpy as np
import pandas as pd
from sklearn.preprocessing import LabelEncoder, StandardScaler, MinMaxScaler
from sklearn.decomposition import PCA
from sklearn.model_selection import StratifiedKFold, cross_val_score, train_test_split
from sklearn.pipeline import make_pipeline
from sklearn.svm import SVC
from sklearn.metrics import accuracy_score, f1_score, roc_auc_score

N_QUBITS = 4
N_COMPONENTS = 4

# ---------------------------------------------------------------------------
# 1. Preprocessing - identical to the original notebook's pipeline
# ---------------------------------------------------------------------------
df = pd.read_csv("data/ghana_water_quality_data.csv")
df = df.drop(columns=["Community", "Latitude", "Longitude", "Year Data Collected"])

le = LabelEncoder()
for col in ["Region", "Contamination Type", "Water Source", "Accessibility", "Urban/Rural"]:
    df[col] = le.fit_transform(df[col])

X = df.drop("Water Quality", axis=1)
y = df["Water Quality"].values
feature_names = list(X.columns)

# The classical reference is evaluated with stratified 5-fold cross-validation.
# Scaling is inside the pipeline so each fold learns its scaler from its
# training partition only; the score is not optimistic from preprocessing
# leakage.
svm_cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
svm_cv_scores = cross_val_score(
    make_pipeline(StandardScaler(), SVC(kernel="rbf")),
    X,
    y,
    cv=svm_cv,
    scoring="accuracy",
)
svm_cv_mean = float(svm_cv_scores.mean())
svm_cv_std = float(svm_cv_scores.std())
print("\nClassical SVM 5-fold cross-validation:")
print("  Fold accuracies:", [f"{score:.4f}" for score in svm_cv_scores])
print(f"  Mean accuracy:   {svm_cv_mean:.4f} +/- {svm_cv_std:.4f}")

scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

X_train, X_test, y_train, y_test = train_test_split(
    X_scaled, y, test_size=0.2, random_state=42
)

# A majority-class classifier is the minimum useful reference for this
# imbalanced target. It learns the most common class from the training split
# and predicts that class for every held-out example.
class_values, class_counts = np.unique(y_train, return_counts=True)
majority_class = int(class_values[np.argmax(class_counts)])
baseline_predictions = np.full_like(y_test, majority_class)
baseline_accuracy = accuracy_score(y_test, baseline_predictions)
dataset_majority_count = int(np.max(np.bincount(y)))
dataset_majority_accuracy = dataset_majority_count / len(y)

print("\nMajority-class baseline:")
print(f"  Dataset distribution: {dataset_majority_count}/{len(y)} ({dataset_majority_accuracy:.4f})")
print(f"  Held-out accuracy:     {baseline_accuracy:.4f}")

# ---------------------------------------------------------------------------
# 2. PCA to 4 components + MinMax scale to [0, pi] (matches original)
# ---------------------------------------------------------------------------
pca = PCA(n_components=N_COMPONENTS)
X_train_pca = pca.fit_transform(X_train)
X_test_pca = pca.transform(X_test)

angle_scaler = MinMaxScaler(feature_range=(0, np.pi))
X_train_angles = angle_scaler.fit_transform(X_train_pca)
X_test_angles = angle_scaler.transform(X_test_pca)


# ---------------------------------------------------------------------------
# 3. Real statevector quantum simulator (4 qubits, RY angle embedding)
# ---------------------------------------------------------------------------
def ry_qubit_state(theta: float) -> np.ndarray:
    """Single-qubit state RY(theta)|0>, as a real 2-vector [cos(t/2), sin(t/2)]."""
    return np.array([np.cos(theta / 2), np.sin(theta / 2)])


def feature_map_state(angles: np.ndarray) -> np.ndarray:
    """
    Full N_QUBITS-qubit statevector after AngleEmbedding: RY(angle_i) applied
    to qubit i, starting from |0000>. Since these are independent
    single-qubit rotations with no entangling gates, the full state is the
    tensor product of each qubit's single-qubit state - computed explicitly
    here via np.kron (real statevector simulation, not a shortcut formula).
    """
    state = np.array([1.0])
    for theta in angles:
        state = np.kron(state, ry_qubit_state(theta))
    return state


def quantum_kernel(angles1: np.ndarray, angles2: np.ndarray) -> float:
    """Fidelity |<psi1|psi2>|^2 between two feature-mapped quantum states."""
    s1 = feature_map_state(angles1)
    s2 = feature_map_state(angles2)
    return float(np.abs(np.vdot(s1, s2)) ** 2)


def quantum_kernel_matrix(A: np.ndarray, B: np.ndarray) -> np.ndarray:
    n, m = len(A), len(B)
    K = np.zeros((n, m))
    for i in range(n):
        for j in range(m):
            K[i, j] = quantum_kernel(A[i], B[j])
    return K


# ---------------------------------------------------------------------------
# 4. Train the QSVC (SVM with precomputed quantum kernel)
#
# The QSVC remains evaluated on the single fixed 80/20 split below. Repeating
# its kernel matrix computation for cross-validation is intentionally outside
# this reproduction script's scope because the quantum kernel is the costly
# part of the run; the resulting QSVC number must therefore be read as a
# point estimate, not as a cross-validated mean.
# ---------------------------------------------------------------------------
print("Computing training kernel matrix...")
K_train = quantum_kernel_matrix(X_train_angles, X_train_angles)

print("Training SVC(kernel='precomputed')...")
clf = SVC(kernel="precomputed", probability=True, random_state=42)
clf.fit(K_train, y_train)

print("Computing test kernel matrix...")
K_test = quantum_kernel_matrix(X_test_angles, X_train_angles)

y_pred = clf.predict(K_test)
y_proba = clf.predict_proba(K_test)[:, 1]

accuracy = accuracy_score(y_test, y_pred)
f1 = f1_score(y_test, y_pred)
auroc = roc_auc_score(y_test, y_proba)

print(f"\nTest accuracy: {accuracy:.4f}")
print(f"Test F1:       {f1:.4f}")
print(f"Test AUROC:    {auroc:.4f}")
print(f"Support vectors: {len(clf.support_)}")
print(f"Gain over baseline: {accuracy - baseline_accuracy:+.4f}")

# ---------------------------------------------------------------------------
# 5. Export everything needed to reproduce this model client-side in TS:
#    PCA + scaler parameters, support vectors (in angle space), dual
#    coefficients, intercept, and Platt-scaling probability calibration.
# ---------------------------------------------------------------------------
support_vector_angles = X_train_angles[clf.support_]

export = {
    "featureNames": feature_names,
    "standardScaler": {
        "mean": scaler.mean_.tolist(),
        "scale": scaler.scale_.tolist(),
    },
    "pca": {
        "mean": pca.mean_.tolist(),
        "components": pca.components_.tolist(),  # shape (4, 18)
    },
    "angleScaler": {
        "dataMin": angle_scaler.data_min_.tolist(),
        "dataRange": angle_scaler.data_range_.tolist(),
    },
    "supportVectors": support_vector_angles.tolist(),  # shape (n_sv, 4), each in [0, pi]
    "dualCoef": clf.dual_coef_[0].tolist(),  # shape (n_sv,)
    "intercept": float(clf.intercept_[0]),
    # Platt scaling, convention libsvm réellement utilisée par scikit-learn :
    # P(y=1|f) = 1 / (1 + exp(A*f - B))
    # (vérifié empiriquement contre predict_proba() côté Python — voir le
    # commentaire détaillé dans src/algorithms/qsvcEstimator.ts, seule source
    # de vérité pour cette formule côté TypeScript.)
    "plattA": float(clf.probA_[0]),
    "plattB": float(clf.probB_[0]),
    "metrics": {"accuracy": accuracy, "f1": f1, "auroc": auroc},
}

with open("scripts/qsvc_export.json", "w") as f:
    json.dump(export, f, indent=2)

print("\nExported to scripts/qsvc_export.json")

# ---------------------------------------------------------------------------
# 6. Sanity check values to cross-verify the TypeScript port against
# ---------------------------------------------------------------------------
print("\n--- Cross-verification reference values ---")
print("Kernel(support_vector[0], support_vector[0]) should be 1.0:")
print(" ", quantum_kernel(support_vector_angles[0], support_vector_angles[0]))
print("Kernel(support_vector[0], support_vector[1]):")
print(" ", quantum_kernel(support_vector_angles[0], support_vector_angles[1]))
print("Kernel(test_point[0], support_vector[0]):")
print(" ", quantum_kernel(X_test_angles[0], support_vector_angles[0]))
print("First test point angles:", X_test_angles[0].tolist())
print("First test point true label:", int(y_test[0]), "predicted:", int(y_pred[0]), "proba:", float(y_proba[0]))
