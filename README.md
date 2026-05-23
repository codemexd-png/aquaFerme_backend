# AquaTrack — Backend

Backend Node.js/Express + PostgreSQL pour l'application AquaTrack (gestion de ferme piscicole).

---

## Stack technique

- **Node.js** — environnement d'exécution JavaScript côté serveur
- **Express** — framework web pour créer les endpoints REST
- **PostgreSQL** — base de données relationnelle
- **JWT (jsonwebtoken)** — authentification par token
- **bcrypt** — hashage des mots de passe
- **dotenv** — gestion des variables d'environnement

---

## Structure du projet

```
aquatrack-backend/
├── src/
│   ├── config/
│   │   └── db.js              ← Connexion PostgreSQL (Pool)
│   ├── middleware/
│   │   └── auth.middleware.js ← Vérification du token JWT
│   ├── routes/
│   │   └── auth.routes.js     ← Déclaration des endpoints auth
│   ├── controllers/
│   │   └── auth.controller.js ← Logique métier (login, userInfo)
│   └── index.js               ← Point d'entrée du serveur Express
├── schema.sql                 ← Script de création des tables PostgreSQL
├── .env                       ← Variables d'environnement (ne pas committer)
├── .env.example               ← Modèle de .env à copier
├── .gitignore
└── package.json
```

---

## Concepts importants

### Express

Framework qui permet de créer un serveur HTTP et de définir des endpoints (routes). C'est lui qui reçoit les requêtes venant du frontend Flutter et renvoie les réponses JSON.

### Routes (`src/routes/`)

Les fichiers de routes servent uniquement à **déclarer les endpoints** et à les brancher sur les bonnes fonctions du controller. Ils ne contiennent pas de logique métier.

Exemple :

```js
router.post("/login", authController.login);
// POST /auth/login → appelle la fonction login dans le controller
```

### Controllers (`src/controllers/`)

Les controllers contiennent la **logique métier** : interroger la base de données, vérifier les mots de passe, générer des tokens, renvoyer les réponses. C'est ici que tu codes vraiment ce que fait chaque endpoint.

### Middleware (`src/middleware/`)

Un middleware est une fonction qui s'exécute **entre la requête et la réponse**. Le middleware JWT (`auth.middleware.js`) vérifie que le token envoyé par Flutter est valide avant de laisser accéder à une route protégée. Si le token est invalide ou absent, il bloque avec une erreur 401.

Pour protéger une route, tu l'ajoutes comme ça :

```js
router.get("/me", verifyToken, authController.userInfo);
// verifyToken s'exécute avant userInfo
```

### `src/config/db.js`

Crée une connexion réutilisable à PostgreSQL via un Pool. Tous les controllers l'importent pour envoyer des requêtes SQL sans recréer une connexion à chaque fois.

---

## Installation et lancement

### 1. Prérequis

- [Node.js](https://nodejs.org) installé
- [PostgreSQL](https://www.postgresql.org/download/) installé et lancé

### 2. Installer PostgreSQL

1. Télécharge PostgreSQL sur https://www.postgresql.org/download/
2. Lance l'installateur et choisis un mot de passe pour l'utilisateur `postgres`
3. Lance **pgAdmin** pour vérifier que PostgreSQL tourne

### 3. Cloner le repo

```bash
git clone https://github.com/votre-org/aquatrack-backend.git
cd aquatrack-backend
```

### 4. Installer les packages

```bash
npm install
```

### 5. Configurer le `.env`

Copie le fichier `.env.example` et renomme-le `.env` :

```bash
cp .env.example .env
```

Ouvre `.env` et remplis tes valeurs :

```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=ton_mot_de_passe_postgres
DB_NAME=aquatrack
JWT_SECRET=aquatrack_super_secret_key_change_en_prod
```

> ⚠️ Ne jamais committer le fichier `.env` — il contient tes secrets.

### 6. Créer la base de données

Dans **pgAdmin** :

1. Clic droit sur **Databases** → **Create** → **Database**
2. Nom : `aquatrack` → **Save**

### 7. Créer les tables

Dans **pgAdmin** :

1. Clique sur la base `aquatrack`
2. Ouvre le **Query Tool**
3. **File → Open** → sélectionne `schema.sql`
4. Clique sur **Execute ▶**

Les 5 tables seront créées : `users`, `ponds`, `fish_operations`, `water_quality`, `tasks`.

### 8. Lancer le serveur

```bash
node src/index.js
```

Tu devrais voir :

```
Serveur démarré sur le port 3000
```

---

## Endpoints disponibles

### Auth

| Méthode | Endpoint      | Accès  | Description                        |
| ------- | ------------- | ------ | ---------------------------------- |
| POST    | `/auth/login` | Public | Connexion avec username + password |
| GET     | `/auth/me`    | 🔒 JWT | Infos de l'utilisateur connecté    |

### Exemple — Login

**Request :**

```json
POST /auth/login
{
  "username": "ibrahim",
  "password": "ton_mot_de_passe"
}
```

**Response :**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Exemple — UserInfo

**Request :**

```
GET /auth/me
Authorization: Bearer <token>
```

**Response :**

```json
{
  "user": {
    "id": 1,
    "username": "ibrahim",
    "role": "admin"
  }
}
```

---

## Utiliser le middleware JWT sur vos routes

Grâce et Lyly — pour protéger vos routes, importez le middleware et ajoutez-le avant votre fonction controller :

```js
const verifyToken = require("../middleware/auth.middleware");

router.get("/ponds", verifyToken, pondController.getAllPonds);
router.post("/fish-operations", verifyToken, fishController.addOperation);
```

Le token de l'utilisateur connecté sera accessible dans `req.user` :

```js
const userId = req.user.id;
const userRole = req.user.role;
```

---

## Répartition des tâches

| Développeur | Responsabilité                                                                         |
| ----------- | -------------------------------------------------------------------------------------- |
| **Ibrahim** | Auth, JWT middleware, structure backend, schema.sql                                    |
| **Grâce**   | Table `ponds` — routes GET /ponds, GET /ponds/:id, GET /ponds/:id/stats                |
| **Lyly**    | Tables `fish_operations`, `water_quality`, `tasks` — routes POST saisie + GET planning |
