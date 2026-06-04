const pool = require("../config/db");
const bcrypt = require("bcrypt");

async function ensureFullName() {
  try {
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(255)`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE`);
  } catch (_) {}
}
ensureFullName();

const getUsers = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, username, role, full_name, is_active FROM users ORDER BY username ASC"
    );
    res.json({ users: result.rows });
  } catch (error) {
    console.error("getUsers error:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

const createUser = async (req, res) => {
  const { username, password, role, fullName } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "username et password sont requis" });
  }
  try {
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (username, password_hash, role, full_name) VALUES ($1, $2, $3, $4) RETURNING id, username, role, full_name`,
      [username, hash, role || "employee", fullName || null]
    );
    res.status(201).json({ user: result.rows[0] });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({ error: "Ce nom d'utilisateur existe deja" });
    }
    console.error("createUser error:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

const updateUser = async (req, res) => {
  const { id } = req.params;
  const { username, role, fullName, password, isActive } = req.body;
  try {
    const sets = [];
    const params = [];
    if (username !== undefined) { params.push(username); sets.push(`username = $` + params.length); }
    if (role !== undefined) { params.push(role); sets.push(`role = $` + params.length); }
    if (fullName !== undefined) { params.push(fullName); sets.push(`full_name = $` + params.length); }
    if (isActive !== undefined) { params.push(isActive); sets.push(`is_active = $` + params.length); }
    if (password) {
      const hash = await bcrypt.hash(password, 10);
      params.push(hash);
      sets.push(`password_hash = $` + params.length);
    }
    if (sets.length === 0) return res.status(400).json({ error: "Aucun champ a modifier" });
    params.push(id);
    const result = await pool.query(
      `UPDATE users SET ` + sets.join(", ") + ` WHERE id = $` + params.length + ` RETURNING id, username, role, full_name, is_active`,
      params
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Utilisateur non trouve" });
    res.json({ user: result.rows[0] });
  } catch (error) {
    if (error.code === "23505") return res.status(409).json({ error: "Ce nom d'utilisateur existe deja" });
    console.error("updateUser error:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

const deleteUser = async (req, res) => {
  const { id } = req.params;
  if (String(id) === String(req.user?.id || req.user?.userId)) {
    return res.status(400).json({ error: "Vous ne pouvez pas supprimer votre propre compte" });
  }
  try {
    const result = await pool.query(`DELETE FROM users WHERE id = $1 RETURNING id`, [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Utilisateur non trouve" });
    res.json({ message: "Utilisateur supprime" });
  } catch (error) {
    console.error("deleteUser error:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

module.exports = { getUsers, createUser, updateUser, deleteUser };
