const pool = require("../config/db");
const bcrypt = require("bcrypt");

const getUsers = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        username,
        username AS "fullName",
        role,
        is_active AS "isActive",
        created_at
      FROM users
      ORDER BY id DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("Erreur récupération utilisateurs :", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

const createUser = async (req, res) => {
  try {
    const { username, password, role } = req.body;

    if (!username || !password || !role) {
      return res.status(400).json({ error: "Champs obligatoires manquants" });
    }

    const allowedRoles = ["admin", "manager", "viewer", "employee"];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ error: "Rôle invalide" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `
      INSERT INTO users (username, password_hash, role, is_active)
      VALUES ($1, $2, $3, TRUE)
      RETURNING id, username, username AS "fullName", role, is_active AS "isActive", created_at
      `,
      [username, passwordHash, role]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Erreur création utilisateur :", error);

    if (error.code === "23505") {
      return res.status(409).json({ error: "Cet identifiant existe déjà" });
    }

    res.status(500).json({ error: "Erreur serveur" });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password, role, isActive } = req.body;

    const currentUser = await pool.query("SELECT * FROM users WHERE id = $1", [id]);

    if (currentUser.rows.length === 0) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    const oldUser = currentUser.rows[0];

    const newUsername = username ?? oldUser.username;
    const newRole = role ?? oldUser.role;
    const newIsActive =
      typeof isActive === "boolean" ? isActive : oldUser.is_active;

    let result;

    if (password) {
      const passwordHash = await bcrypt.hash(password, 10);

      result = await pool.query(
        `
        UPDATE users
        SET username = $1,
            password_hash = $2,
            role = $3,
            is_active = $4,
            updated_at = NOW()
        WHERE id = $5
        RETURNING id, username, username AS "fullName", role, is_active AS "isActive", created_at
        `,
        [newUsername, passwordHash, newRole, newIsActive, id]
      );
    } else {
      result = await pool.query(
        `
        UPDATE users
        SET username = $1,
            role = $2,
            is_active = $3,
            updated_at = NOW()
        WHERE id = $4
        RETURNING id, username, username AS "fullName", role, is_active AS "isActive", created_at
        `,
        [newUsername, newRole, newIsActive, id]
      );
    }

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

module.exports = {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
};