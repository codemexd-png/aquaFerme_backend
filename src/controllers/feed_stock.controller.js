const pool = require('../config/db');

async function ensureTable() {
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS feed_stock (
      id SERIAL PRIMARY KEY,
      product_name VARCHAR(255) NOT NULL,
      quantity_kg NUMERIC(10,2) NOT NULL DEFAULT 0,
      alert_threshold_kg NUMERIC(10,2) NOT NULL DEFAULT 50,
      updated_at TIMESTAMP DEFAULT NOW()
    )`);
    await pool.query(`ALTER TABLE feed_stock ADD COLUMN IF NOT EXISTS alert_threshold_kg NUMERIC(10,2) NOT NULL DEFAULT 50`).catch(()=>{});
    await pool.query(`ALTER TABLE feed_stock ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()`).catch(()=>{});
  } catch(_) {}
}
ensureTable();

const toRow = (r) => ({
  id: r.id,
  productName: r.product_name,
  quantityKg: parseFloat(r.quantity_kg || 0),
  alertThresholdKg: parseFloat(r.alert_threshold_kg || 50),
  updatedAt: r.updated_at,
});

exports.getAllStock = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM feed_stock ORDER BY product_name ASC');
    res.json(result.rows.map(toRow));
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

exports.createStock = async (req, res) => {
  const { productName, quantityKg, alertThresholdKg } = req.body;
  if (!productName) return res.status(400).json({ error: 'productName requis' });
  try {
    const result = await pool.query(
      `INSERT INTO feed_stock (product_name, quantity_kg, alert_threshold_kg) VALUES ($1, $2, $3) RETURNING *`,
      [productName, quantityKg || 0, alertThresholdKg || 50]
    );
    res.status(201).json(toRow(result.rows[0]));
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

exports.updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantityKg, alertThresholdKg } = req.body;
    const result = await pool.query(
      `UPDATE feed_stock SET quantity_kg = COALESCE($1, quantity_kg), alert_threshold_kg = COALESCE($2, alert_threshold_kg), updated_at = NOW() WHERE id = $3 RETURNING *`,
      [quantityKg != null ? quantityKg : null, alertThresholdKg != null ? alertThresholdKg : null, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Produit introuvable' });
    res.json(toRow(result.rows[0]));
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

exports.deleteStock = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM feed_stock WHERE id = $1', [id]);
    res.json({ message: 'Supprime' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};