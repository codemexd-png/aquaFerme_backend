const pool = require("../config/db");
const bcrypt = require("bcrypt");

// Récupérer tous les utilisateurs
const getUsers = async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT 
        id, 
        username, 
        username AS "fullName",
        role,
        is_active AS "isActive"
      FROM users 
      ORDER BY username ASC
      `
    );

    res.json({ users: result.rows });
  } catch (error) {
    console.error("getUsers error:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, role, isActive } = req.body;

    const result = await pool.query(
      `
      UPDATE users
      SET 
        username = COALESCE($1, username),
        role = COALESCE($2, role),
        is_active = COALESCE($3, is_active),
        updated_at = NOW()
      WHERE id = $4
      RETURNING id, username, username AS "fullName", role, is_active AS "isActive"
      `,
      [username, role, isActive, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Erreur modification utilisateur :", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query("DELETE FROM users WHERE id = $1", [id]);

    res.json({ message: "Utilisateur supprimé" });
  } catch (error) {
    console.error("Erreur suppression utilisateur :", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

module.exports = { getUsers, updateUser, deleteUser };

