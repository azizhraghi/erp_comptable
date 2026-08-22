# Tests d'isolation entre dossiers

L'isolation est la promesse la plus sensible du produit : un cabinet ne peut
pas se permettre qu'une donnée du dossier A apparaisse dans le dossier B.

Ces tests se traitent comme des **tests de sécurité**, pas comme des tests
fonctionnels. Conséquence pratique : un échec ici bloque le déploiement, sans
discussion et sans contournement temporaire.

## Le piège à éviter

Tester l'isolation avec la clé `service_role` ne prouve rien : elle porte
l'attribut `BYPASSRLS` et voit tout. Chaque test doit s'exécuter avec un JWT
de collaborateur réel, obtenu via GoTrue, ou avec `set local role authenticated`
et `request.jwt.claims` positionné.

```sql
-- Se placer dans la peau d'un collaborateur donné
set local role authenticated;
set local request.jwt.claims = '{"sub":"<uuid-collaborateur>","role":"authenticated"}';
```

## Jeu de données minimal

| Objet | Valeur |
|---|---|
| Cabinet | `CAB` |
| Dossiers | `DOS-A`, `DOS-B` |
| Alice | profil `senior`, affectée à `DOS-A` uniquement |
| Bob | profil `senior`, affecté à `DOS-B` uniquement |
| Chloé | profil `administrateur`, aucune affectation explicite |
| David | profil `lecture`, affecté à `DOS-A` |

Chaque dossier reçoit un exercice ouvert, un journal, quelques comptes, un
tiers et au moins une pièce validée.

## Cas à vérifier

### Lecture

| # | Attendu |
|---|---|
| 1 | Alice liste `dossier` → une seule ligne, `DOS-A` |
| 2 | Alice liste `ecriture` → aucune ligne de `DOS-B` |
| 3 | Alice interroge `piece` par un identifiant connu de `DOS-B` → zéro ligne, **pas** une erreur de permission |
| 4 | Chloé, administratrice sans affectation, voit `DOS-A` et `DOS-B` |
| 5 | Alice lit `audit_log` → aucune trace de `DOS-B` |
| 6 | Alice lit `regle_imputation` de portée `dossier` appartenant à `DOS-B` → zéro ligne |
| 7 | Alice lit `regle_imputation` de portée `cabinet` → visible, et **aucun champ nominatif** dans `condition` ni `imputation` |

Le cas 3 mérite attention : le comportement correct d'une RLS est de renvoyer
un ensemble vide, pas une erreur. Une erreur de permission confirmerait à
l'appelant que l'identifiant existe.

### Écriture

| # | Attendu |
|---|---|
| 8 | Alice insère une `ecriture` avec `dossier_id = DOS-B` → rejet |
| 9 | Alice tente de déplacer une pièce de `DOS-A` vers `DOS-B` par UPDATE → rejet |
| 10 | David, profil lecture, insère dans `DOS-A` → rejet |
| 11 | David passe une pièce de `brouillon` à `revise` → rejet |
| 12 | Alice, profil senior, passe une pièce à `supervise` → rejet (réservé superviseur) |

### Immuabilité et traçabilité

| # | Attendu |
|---|---|
| 13 | UPDATE sur une `ecriture` dont la pièce est `valide` → rejet |
| 14 | DELETE sur cette même écriture → rejet |
| 15 | UPDATE sur `audit_log` → rejet |
| 16 | DELETE sur `audit_log` → rejet |
| 17 | INSERT direct dans `audit_log` depuis un client `authenticated` → rejet (aucune policy d'insertion) |

### Fuite par la couche agents

C'est le chemin le plus facile à oublier, parce que ces tables sont récentes
et qu'on les teste rarement avec l'attention portée au grand livre.

| # | Attendu |
|---|---|
| 18 | Alice lit `document` → aucun document de `DOS-B` |
| 19 | Alice lit `proposition` → aucune proposition de `DOS-B` |
| 20 | Alice lit `memoire_imputation` → aucun enregistrement de `DOS-B` |
| 21 | Alice lit `correction` → aucune correction de `DOS-B` |
| 22 | Alice lit `agent_execution` → le champ `sources` ne contient aucun extrait issu de `DOS-B` |

Le cas 22 ne se vérifie pas par une policy : c'est la construction du contexte
RAG côté agent qui doit être testée. Une policy correcte sur
`memoire_imputation` n'empêche pas un agent mal écrit, tournant en
`service_role`, d'agréger deux dossiers dans un même prompt. **C'est le
scénario de fuite le plus probable de toute l'architecture** et il ne se
détecte qu'en inspectant `agent_execution.sources` après coup.

### Mutualisation

| # | Attendu |
|---|---|
| 23 | Une règle promue en portée `cabinet` ne contient ni montant, ni identifiant de tiers, ni extrait de pièce |
| 24 | La promotion d'une règle de `dossier` vers `cabinet` exige une action explicite d'administrateur |
| 25 | Par défaut, le partage inter-dossiers est désactivé sur un cabinet neuf |

## Automatisation

Ces vingt-cinq cas s'exécutent en pgTAP dans le pipeline, avant tout
déploiement. Ils ne sont pas des tests d'intégration optionnels : leur échec
doit interrompre la livraison.
