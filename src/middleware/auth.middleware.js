//Lire le token dans le header de la requête

const jwt = require("jsonwebtoken");
require("dotenv").config();

// Middleware pour vérifier le token JWT dans les requêtes protégées
const verifyToken = (req, res, next) => {
  /**Quand le front envoie une requête protégée, il doit inclure le token JWT dans le header Authorization */
  const authHeader = req.headers["authorization"];

  //On vérifie que le header Authorization existe et commence par "Bearer " car la convention c'est   Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token manquant" });
  }

  //On extrait le token en supprimant "Bearer " du début

  //on récupère le token en supprimant "Bearer " du début du header Authorization car ils sont dans un tableau lors du split et on prend le deuxième élément (index 1) qui est le token lui-même
  const token = authHeader.split(" ")[1];


  try {
      //On vérifie que le token est valide en utilisant la clé secrète définie dans les variables d'environnement
      //Si le token est valide, jwt.verify() retourne les données décodées (payload) qui ont été encodées lors de la création du token.
      //On stocke ces données décodées dans req.user pour les utiliser dans les routes protégées, par exemple pour savoir quel utilisateur fait la requête.
      
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Token invalide" });
  }
};

module.exports = verifyToken;
