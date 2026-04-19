# 🧩 Lootopia – Scripts & Base de Données

Ce document explique les scripts disponibles pour gérer :

- l’application
- la base de données Prisma
- les tests (unitaires et intégration)

---

# 🚀 Application

## Lancer en développement

```bash
npm run dev
```

## Build & production

```bash
npm run build
npm run start
```

## Lint

```bash
npm run lint
```

---

# 🗄️ Base de données (Prisma)

## Vérification & génération

```bash
npm run db:check        # Vérifie le schéma Prisma
npm run db:generate     # Génère le client Prisma
```

## Migrations

```bash
npm run db:migrate      # Crée + applique une migration (DEV uniquement)
```

```bash
npm run db:sync         # Workflow complet après modif du schéma :
                        # - validate
                        # - migrate
                        # - generate
```

## Seed

```bash
npm run db:seed         # Remplit la base avec des données déterministes
```

## Reset DEV

```bash
npm run db:reset        # /!\ Supprime la DB + migrations + seed /!\ - A utiliser en DEV uniquement
```

## Setup projet

```bash
npm run db:setup        # Applique migrations + seed
```

## Interface DB

```bash
npm run db:studio       # Prisma Studio
```

---

# 🧪 Tests unitaires

```bash
npm run test            # Lance les tests unitaires
npm run test:watch      # Mode watch
npm run test:coverage   # Rapport de coverage
```

---

# 🔥 Tests d’intégration

Utilisent :

- base PostgreSQL réelle (lootopia_test:
  ```docker compose exec db psql -U postgres -c "CREATE DATABASE lootopia_test;"```)
- fichier .env.test (copier .env.example et changer le nom de la BDD dans l'URL)

## Lancer les tests

```bash
npm run test:integration
```

## Reset DB de test

```bash
npm run db:test:reset
```

## Setup DB de test

A lancer avant les tests d'intégration

```bash
npm run db:test:setup
```

---

# 🧠 Bonnes pratiques

## Développement

- Modifier schema → ```npm run db:sync```
- DB cassée → ```npm run db:reset```

## Tests intégration

Toujours repartir d’un état propre :

```bash
npm run db:test:reset
```

## Nouveau développeur

```bash
npm run db:setup
```

---

# 🧬 Seed

Le seed utilise :

- UUID déterministes
- données métier cohérentes

Avantages :

- reproductibilité
- debug simplifié
- lisibilité

---

# ⚠️ Notes

- ```db:migrate``` = DEV uniquement
- ```db:reset``` = supprime toutes les données
- ne jamais utiliser en production

---

# 🧭 Résumé

| Besoin            | Commande               |
|-------------------|------------------------|
| Modifier schema   | ```db:sync```          |
| Reset dev         | ```db:reset```         |
| Setup projet      | ```db:setup```         |
| Tests unitaires   | ```test```             |
| Tests intégration | ```test:integration``` |
| Reset DB test     | ```db:test:reset```    |
