// permet de faire le lien entre la base de données et les routes
const pool = require("../config/db");

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
    console.error("Erreur récupération utilisateurs :", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

const bcrypt = require("bcryptjs");

// Créer un utilisateur
const createUser = async (req, res) => {
  try {
    const { username, password, role } = req.body;

    if (!username || !password || !role) {
      return res.status(400).json({
        error: "username, password et role sont obligatoires",
      });
    }

    const existingUser = await pool.query(
      "SELECT id FROM users WHERE username = $1",
      [username]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        error: "Cet utilisateur existe déjà",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `
      INSERT INTO users (username, password_hash, role)
      VALUES ($1, $2, $3)
      RETURNING
        id,
        username,
        username AS "fullName",
        role,
        is_active AS "isActive"
      `,
      [username, hashedPassword, role]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Erreur création utilisateur :", error);
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

module.exports = { getUsers, createUser, updateUser, deleteUser };

