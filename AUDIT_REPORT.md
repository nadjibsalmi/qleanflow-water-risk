# Rapport d'audit — QleanFlow Water Risk

## Périmètre et méthode

Audit réalisé sur la branche `chore/full-audit-optimization`, créée depuis
`main` synchronisée avec `origin/main`.

Le périmètre couvre l'organisation du code, les dépendances, la sécurité, le
typage TypeScript, ESLint, le formatage, les tests, le build Next.js, la
performance, l'accessibilité, la maintenabilité, la CI/CD et les algorithmes
du modèle.

Les données, les paramètres QSVC, les exports d'entraînement et les résultats
du modèle n'ont pas été modifiés.

## Synthèse

Le projet est fonctionnel et dispose déjà d'une bonne couverture de tests sur
le pipeline QSVC, la simulation quantique, l'ingestion CSV et les composants
principaux. Les problèmes effectivement identifiés et corrigés sont :

- dépendances vulnérables signalées par `npm audit` ;
- contrôles TypeScript, formatage et audit absents de la CI ;
- écarts de formatage dans 14 fichiers.

Les validations finales passent toutes, avec zéro vulnérabilité npm détectée
et 28 tests réussis.

## Problèmes trouvés par gravité

### Critique

Aucun problème critique identifié.

### Élevée

1. **Dépendances vulnérables**
   - L'audit initial signalait cinq vulnérabilités élevées.
   - `next@16.2.10` entraînait plusieurs avis de sécurité Next.js et des
     vulnérabilités transitives dans PostCSS et Sharp.
   - `brace-expansion` était vulnérable dans les dépendances transitives
     d'ESLint.
   - `undici` était vulnérable dans l'environnement de test via JSDOM.

2. **Contrôles de qualité incomplets dans la CI**
   - La CI exécutait ESLint, les tests et le build, mais pas TypeScript,
     Prettier ou `npm audit`.

### Moyenne

1. **Formatage non conforme**
   - `prettier --check .` échouait sur 14 fichiers.
   - Les écarts concernaient uniquement le formatage, les fins de ligne et
     l'alignement de tableaux Markdown ; aucun comportement applicatif
     n'était en cause.

### Faible / observation

1. **Mesure de performance navigateur**
   - La documentation existante indique qu'aucun audit Lighthouse formel
     n'a été réalisé.
   - Le découpage par route et le chargement des graphiques sont déjà
     documentés ; aucune optimisation React/Next.js sûre et nécessaire n'a
     été identifiée sans mesure supplémentaire.

2. **Avertissement de build local**
   - Next.js signale que le `pnpm-workspace.yaml` du répertoire parent est
     hors de la racine Git de ce dépôt imbriqué.
   - Le build réussit et le dépôt ciblé utilise npm ; aucun changement de
     configuration n'a été ajouté pour masquer cet avertissement.

## Corrections réalisées

### Dépendances et sécurité

- Mise à niveau de `next` de `16.2.10` à `16.3.0`.
- Mise à niveau de `eslint-config-next` de `16.2.10` à `16.3.0`.
- Mise à jour du lockfile npm.
- Résolution des versions transitives corrigées, notamment
  `brace-expansion@1.1.18`, `brace-expansion@5.0.9` et `undici@7.29.0`.
- Aucun secret, fichier `.env`, token ou credential n'a été ajouté ou
  modifié.

### CI/CD

La CI exécute désormais explicitement :

- `npx tsc --noEmit` ;
- `npm run format:check` ;
- `npm audit --audit-level=high` ;
- en plus des contrôles existants de lint, tests et build.

### Formatage

Les 14 fichiers signalés par Prettier ont été formatés sans modification de
leur logique métier.

## Optimisations appliquées

- Suppression des versions vulnérables de Next.js et de leurs dépendances
  transitives.
- Renforcement du pipeline CI afin de bloquer les régressions de typage,
  formatage et sécurité.
- Aucun changement des calculs, seuils, paramètres, données ou résultats du
  modèle, conformément aux contraintes de validation scientifique.

## Fichiers modifiés

- `.github/dependabot.yml`
- `.github/workflows/ci.yml`
- `CHANGELOG.md`
- `README.md`
- `ROADMAP.md`
- `docs/MODEL.md`
- `package.json`
- `package-lock.json`
- `src/app/(dashboard)/methodology/page.tsx`
- `src/app/(dashboard)/model/page.tsx`
- `src/app/(dashboard)/page.tsx`
- `src/app/(dashboard)/regions/page.tsx`
- `src/app/error.tsx`
- `src/app/loading.tsx`
- `src/app/not-found.tsx`
- `src/components/dashboard/dashboard.test.tsx`
- `src/services/waterQualityData.test.ts`

Le présent rapport est ajouté à cette liste après sa création.

## Commandes exécutées et résultats finaux

| Commande                             | Résultat                                    |
| ------------------------------------ | ------------------------------------------- |
| `npm audit --audit-level=high`       | Réussi — 0 vulnérabilité                    |
| `npx tsc --noEmit`                   | Réussi                                      |
| `npm run lint`                       | Réussi                                      |
| `npm run format:check`               | Réussi — tous les fichiers conformes        |
| `npm run test -- --reporter=verbose` | Réussi — 6 suites, 28 tests                 |
| `npm run build`                      | Réussi — Next.js 16.3.0, 6 routes statiques |
| `npx next build`                     | Réussi — Next.js 16.3.0, 6 routes statiques |
| `git diff --check`                   | Réussi                                      |

Chaque groupe de corrections a été suivi par les contrôles demandés. Le
cycle final a été exécuté après `npm ci` afin de valider les versions
réellement installées depuis le lockfile.

## Vérifications restantes

- Les contrôles locaux passent tous.
- Aucun secret, token, fichier temporaire ou fichier généré inutile n'est
  présent dans le diff.
- Aucun fichier sous `data/`, `src/algorithms/`, `scripts/` ou
  `src/config/model.ts` n'a été modifié.
- Aucun problème applicatif restant n'a été identifié dans le périmètre de
  cet audit.

## Risques résiduels

- Les métriques et la provenance du CSV restent des limites scientifiques
  documentées du projet ; elles n'ont pas été modifiées.
- L'application reste un outil exploratoire et ne doit pas remplacer des
  mesures de terrain ou des analyses de laboratoire.
- Une mesure Lighthouse complète reste recommandée avant une mise en
  production publique.
- L'avertissement de racine Turbopack peut apparaître lorsque le dépôt est
  exécuté depuis ce workspace parent, mais il n'empêche pas le build.

## Recommandations futures

1. Exécuter Lighthouse ou un audit axe dans un environnement CI disposant
   d'un navigateur complet.
2. Ajouter une provenance vérifiable ou remplacer le CSV de démonstration
   avant tout usage opérationnel.
3. Compléter et publier une métrique QNN finale reproductible.
4. Mesurer régulièrement la taille des bundles et les temps d'interaction
   sur les routes principales.
5. Maintenir les mises à jour Dependabot et conserver l'audit npm dans la CI.
