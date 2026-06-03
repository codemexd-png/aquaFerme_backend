const pool = require('../config/db');

// Crée la table si elle n'existe pas encore
async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS fish_orders (
      id                  SERIAL PRIMARY KEY,
      supplier            VARCHAR(255) NOT NULL,
      species             VARCHAR(100) NOT NULL DEFAULT 'Tilapia',
      quantity            INTEGER      NOT NULL,
      unit_price_fcfa     INTEGER,
      destination_pond_id INTEGER,
      status              VARCHAR(50)  NOT NULL DEFAULT 'pending',
      notes               TEXT,
      order_date          DATE         NOT NULL DEFAULT CURRENT_DATE,
      created_by          INTEGER,
      created_at          TIMESTAMP    NOT NULL DEFAULT NOW()
    )
  `);
  // Ajoute les colonnes manquantes si la table existait déjà
  await pool.query(`ALTER TABLE fish_orders ADD COLUMN IF NOT EXISTS unit_price_fcfa INTEGER`).catch(() => {});
  await pool.query(`ALTER TABLE fish_orders ADD COLUMN IF NOT EXISTS destination_pond_id INTEGER`).catch(() => {});
  await pool.query(`ALTER TABLE fish_orders ADD COLUMN IF NOT EXISTS species VARCHAR(100) DEFAULT 'Tilapia'`).catch(() => {});
  await pool.query(`ALTER TABLE fish_orders ADD COLUMN IF NOT EXISTS notes TEXT`).catch(() => {});
  await pool.query(`ALTER TABLE fish_orders ADD COLUMN IF NOT EXISTS order_date DATE DEFAULT CURRENT_DATE`).catch(() => {});
  await pool.query(`ALTER TABLE fish_orders ADD COLUMN IF NOT EXISTS created_by INTEGER`).catch(() => {});
  await pool.query(`ALTER TABLE fish_orders ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW()`).catch(() => {});
}
ensureTable().catch(console.error);

// GET /fish-orders → liste toutes les commandes
const getOrders = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        fo.id,
        fo.supplier,
        fo.species,
        fo.quantity,
        fo.unit_price_fcfa   AS "unitPriceFcfa",
        fo.destination_pond_id AS "destinationPondId",
        p.name               AS "pondName",
        fo.status,
        fo.notes,
        fo.order_date        AS "date",
        fo.created_at        AS "createdAt",
        u.username           AS "createdBy"
      FROM fish_orders fo
      LEFT JOIN ponds p  ON p.id = fo.destination_pond_id
      LEFT JOIN users u  ON u.id = fo.created_by
      ORDER BY fo.created_at DESC
    `);
    res.json({ fish_orders: result.rows });
  } catch (err) {
    console.error('getOrders:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// POST /fish-orders → créer une commande
const createOrder = async (req, res) => {
  const { supplier, species, quantity, unitPriceFcfa, destinationPondId, status, notes } = req.body;
  if (!supplier || !quantity) {
    return res.status(400).json({ error: 'supplier et quantity sont obligatoires' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO fish_orders (supplier, species, quantity, unit_price_fcfa, destination_pond_id, status, notes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING
         id, supplier, species, quantity,
         unit_price_fcfa AS "unitPriceFcfa",
         destination_pond_id AS "destinationPondId",
         status, notes,
         order_date AS "date",
         created_at AS "createdAt"`,
      [supplier, species || 'Tilapia', quantity, unitPriceFcfa || null, destinationPondId || null, status || 'pending', notes || null, req.user.userId]
    );
    res.status(201).json({ fish_order: result.rows[0] });
  } catch (err) {
    console.error('createOrder:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// PATCH /fish-orders/:id → mettre à jour
const updateOrder = async (req, res) => {
  const { id } = req.params;
  const { supplier, species, quantity, unitPriceFcfa, destinationPondId, status, notes } = req.body;
  try {
    const result = await pool.query(
      `UPDATE fish_orders
       SET supplier = COALESCE($1, supplier),
           species  = COALESCE($2, species),
           quantity = COALESCE($3, quantity),
           unit_price_fcfa = $4,
           destination_pond_id = $5,
           status = COALESCE($6, status),
           notes  = $7
       WHERE id = $8
       RETURNING
         id, supplier, species, quantity,
         unit_price_fcfa AS "unitPriceFcfa",
         destination_pond_id AS "destinationPondId",
         status, notes,
         order_date AS "date",
         created_at AS "createdAt"`,
      [supplier || null, species || null, quantity || null, unitPriceFcfa || null, destinationPondId || null, status || null, notes || null, id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Commande non trouvée' });
    res.json({ fish_order: result.rows[0] });
  } catch (err) {
    console.error('updateOrder:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// DELETE /fish-orders/:id
const deleteOrder = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM fish_orders WHERE id = $1 RETURNING id', [id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Commande non trouvée' });
    res.json({ message: 'Commande supprimée' });
  } catch (err) {
    console.error('deleteOrder:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = { getOrders, createOrder, updateOrder, deleteOrder };
