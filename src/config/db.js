/**
 * ce fichier permet à mon backend de communiquer avec ma  base de données PostgreSQL
 * Pour que mon backend puisse envoyer des requêtes sql à postgreSQL, je dois d'abord établir une connexion entre les deux.
 * On crée un pool (groupe de connexion ouverte en permanence) en utilisant les informations de connexion (hôte, port, utilisateur,
 * mot de passe et nom de la base de données) qui sont stockées dans des variables d'environnement pour des raisons de sécurité.
 * Ensuite, on exporte ce pool pour qu'il puisse être utilisé dans d'autres parties de l'application pour exécuter des requêtes SQL.
 */
const { Pool } = require("pg");
require("dotenv").config(); //

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// On teste la connexion à PostgreSQL en exécutant une requête simple "SELECT NOW()"

/**
 * pool.query("SELECT NOW()", (err, res) => {
  if (err) {
    console.error("Erreur connexion PostgreSQL :", err.message);
  } else {
    console.log("PostgreSQL connecté :", res.rows[0].now);
  }
});
 */

module.exports = pool;
