// permet de faire le lien entre la base de données et les routes
const pool = require("../config/db");

// Récupérer tous les utilisateurs

const getUsers = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, username, role FROM users ORDER BY username ASC",
    );
    res.json({ users: result.rows });
  } catch (error) {
    console.error("Erreur récupération utilisateurs :", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

module.exports = { getUsers };
