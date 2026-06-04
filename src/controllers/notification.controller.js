const pool = require('../config/db');

// GET /notifications — récupère toutes les notifs (les plus récentes d'abord)
const getNotifications = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50`
    );
    res.json({ notifications: result.rows });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// POST /notifications — crée une nouvelle notif (admin/manager)
const createNotification = async (req, res) => {
  const { message } = req.body;
  const user_id = req.user.id;
  if (!message) return res.status(400).json({ error: 'Message obligatoire' });
  try {
    const result = await pool.query(
      `INSERT INTO notifications (user_id, message) VALUES ($1, $2) RETURNING *`,
      [user_id, message]
    );
    res.status(201).json({ notification: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// PATCH /notifications/:id/read — marque une notif comme lue
const markAsRead = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query(
      `UPDATE notifications SET is_read = TRUE WHERE id = $1`,
      [id]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// PATCH /notifications/read-all — marque toutes les notifs comme lues
const markAllAsRead = async (req, res) => {
  try {
    await pool.query(`UPDATE notifications SET is_read = TRUE`);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = { getNotifications, createNotification, markAsRead, markAllAsRead };