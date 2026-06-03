const pool = require('../config/db');

// Crée les tables si elles n'existent pas encore
async function ensureTables() {
  // Utilise ALTER TABLE ADD COLUMN IF NOT EXISTS pour être compatible avec une table existante
  await pool.query(`
    CREATE TABLE IF NOT EXISTS sales (
      id              SERIAL PRIMARY KEY,
      client_name     VARCHAR(255) NOT NULL,
      pond_id         INTEGER,
      quantity_kg     NUMERIC(10,2) NOT NULL,
      unit_price_fcfa INTEGER       NOT NULL,
      sale_date       DATE          NOT NULL DEFAULT CURRENT_DATE,
      created_by      INTEGER,
      created_at      TIMESTAMP     NOT NULL DEFAULT NOW()
    )
  `);
  // Ajoute les colonnes manquantes si la table existait déjà avec un autre schéma
  await pool.query(`ALTER TABLE sales ADD COLUMN IF NOT EXISTS pond_id INTEGER`).catch(() => {});
  await pool.query(`ALTER TABLE sales ADD COLUMN IF NOT EXISTS client_name VARCHAR(255)`).catch(() => {});
  await pool.query(`ALTER TABLE sales ADD COLUMN IF NOT EXISTS quantity_kg NUMERIC(10,2)`).catch(() => {});
  await pool.query(`ALTER TABLE sales ADD COLUMN IF NOT EXISTS unit_price_fcfa INTEGER`).catch(() => {});
  await pool.query(`ALTER TABLE sales ADD COLUMN IF NOT EXISTS sale_date DATE DEFAULT CURRENT_DATE`).catch(() => {});
  await pool.query(`ALTER TABLE sales ADD COLUMN IF NOT EXISTS created_by INTEGER`).catch(() => {});
  await pool.query(`ALTER TABLE sales ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW()`).catch(() => {});

  await pool.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id         SERIAL PRIMARY KEY,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
  await pool.query(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS title VARCHAR(255) NOT NULL DEFAULT ''`).catch(() => {});
  await pool.query(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS message TEXT`).catch(() => {});
  await pool.query(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS type VARCHAR(50) NOT NULL DEFAULT 'info'`).catch(() => {});
  await pool.query(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS read BOOLEAN NOT NULL DEFAULT FALSE`).catch(() => {});
}
ensureTables().catch(console.error);

// GET /sales → toutes les ventes
const getSales = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        s.id,
        s.client_name     AS "clientName",
        s.pond_id         AS "pondId",
        p.name            AS "pondName",
        s.quantity_kg     AS "quantityKg",
        s.unit_price_fcfa AS "unitPriceFcfa",
        s.sale_date       AS "date",
        s.created_at      AS "createdAt",
        u.username        AS "createdBy"
      FROM sales s
      LEFT JOIN ponds p ON p.id = s.pond_id
      LEFT JOIN users u ON u.id = s.created_by
      ORDER BY s.created_at DESC
    `);
    res.json({ sales: result.rows });
  } catch (err) {
    console.error('getSales:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// POST /sales → enregistrer une vente
const createSale = async (req, res) => {
  const { clientName, pondId, quantityKg, unitPriceFcfa, date } = req.body;
  if (!clientName || !quantityKg || !unitPriceFcfa) {
    return res.status(400).json({ error: 'clientName, quantityKg et unitPriceFcfa sont obligatoires' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO sales (client_name, pond_id, quantity_kg, unit_price_fcfa, sale_date, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING
         id, client_name AS "clientName", pond_id AS "pondId",
         quantity_kg AS "quantityKg", unit_price_fcfa AS "unitPriceFcfa",
         sale_date AS "date", created_at AS "createdAt"`,
      [clientName, pondId || null, quantityKg, unitPriceFcfa, date || new Date().toISOString().split('T')[0], req.user.userId]
    );
    const sale = result.rows[0];

    // Créer une notification automatique
    const totalFcfa = (Number(quantityKg) * Number(unitPriceFcfa)).toLocaleString('fr-FR');
    await pool.query(
      `INSERT INTO notifications (title, message, type)
       VALUES ($1, $2, 'success')`,
      [`Vente enregistrée`, `${quantityKg} kg vendus à ${clientName} — ${totalFcfa} FCFA`]
    );

    res.status(201).json({ sale });
  } catch (err) {
    console.error('createSale:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// DELETE /sales/:id
const deleteSale = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM sales WHERE id = $1 RETURNING id', [id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Vente non trouvée' });
    res.json({ message: 'Vente supprimée' });
  } catch (err) {
    console.error('deleteSale:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// GET /notifications → toutes les notifications (les 30 dernières)
const getNotifications = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, title, message, type, read, created_at AS "createdAt"
       FROM notifications
       ORDER BY created_at DESC
       LIMIT 30`
    );
    res.json({ notifications: result.rows });
  } catch (err) {
    console.error('getNotifications:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// PATCH /notifications/:id/read → marquer comme lu
const markRead = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('UPDATE notifications SET read = TRUE WHERE id = $1', [id]);
    res.json({ message: 'Lu' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// PATCH /notifications/read-all → tout marquer comme lu
const markAllRead = async (req, res) => {
  try {
    await pool.query('UPDATE notifications SET read = TRUE');
    res.json({ message: 'Tout marqué comme lu' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = { getSales, createSale, deleteSale, getNotifications, markRead, markAllRead };
