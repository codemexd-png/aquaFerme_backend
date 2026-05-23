// On importe Express — le framework qui gère les requêtes HTTP
const express = require('express');

// On importe CORS — permet au frontend Flutter d'appeler le backend
// sans être bloqué par le navigateur (Cross-Origin Resource Sharing)
const cors = require('cors');

// On charge les variables du fichier .env dans process.env
require('dotenv').config();

// On importe les routes d'authentification qu'on va créer après
const authRoutes = require('./routes/auth.routes');
const fishOperationRoutes = require('./routes/fishOperation.routes');
const waterQualityRoutes = require('./routes/waterQuality.routes');
const taskRoutes = require('./routes/task.routes');

// On crée l'application Express
const app = express();

// On active CORS pour toutes les requêtes entrantes
app.use(cors());

// On dit à Express de lire le body des requêtes en JSON
// Sans ça, req.body sera undefined dans les controllers
app.use(express.json());

// On branche les routes auth sur le préfixe /auth
// Donc POST /auth/login, GET /auth/me etc. seront gérés par authRoutes
app.use('/auth', authRoutes);
app.use('/fish-operations', fishOperationRoutes);
app.use('/water-quality', waterQualityRoutes);
app.use('/tasks', taskRoutes);

// On récupère le port depuis .env, ou 3000 par défaut
const PORT = process.env.PORT || 3000;

// On démarre le serveur et on affiche un message de confirmation
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});

/**
 * Ce fichier est le point d'entrée de notre application backend. Il configure et démarre le serveur Express. 
 * Aussi il authorise les requêtes CORS pour permettre au frontend Flutter de communiquer avec le backend sans être bloqué par le navigateur.
 * Il branche les roues , quand une requête arrive c'est lui qui la dirige vers le bon fichier de routes 
 * Il démarre le serveur sur le port spécifié dans les variables d'environnement ou 3000 par défaut, et affiche un message de confirmation dans la console.
 */