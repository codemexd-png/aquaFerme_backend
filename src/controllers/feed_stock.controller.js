const pool = require('../config/db');

// GET /feed-stock — liste tous les produits
exports.getAllStock = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM feed_stock ORDER BY product_name ASC'
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// PUT /feed-stock/:id — met à jour la quantité d'un produit
exports.updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity_kg } = req.body;

    const result = await pool.query(
      `UPDATE feed_stock 
       SET quantity_kg = $1, updated_at = NOW() 
       WHERE id = $2 
       RETURNING *`,
      [quantity_kg, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Produit introuvable' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// POST /feed-stock — ajouter un produit
exports.createStock = async (req, res) => {
  try {
    const { product_name, quantity_kg, alert_threshold_kg } = req.body;

    if (!product_name || quantity_kg === undefined) {
      return res.status(400).json({
        message: "Le nom du produit et la quantité sont obligatoires",
      });
    }

    const result = await pool.query(
      `INSERT INTO feed_stock (product_name, quantity_kg, alert_threshold_kg)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [product_name, quantity_kg, alert_threshold_kg || 50]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// PATCH /feed-stock/:id — modifier un produit
exports.updateStockFull = async (req, res) => {
  try {
    const { id } = req.params;
    const { product_name, quantity_kg, alert_threshold_kg } = req.body;

    const result = await pool.query(
      `UPDATE feed_stock
       SET
        product_name = COALESCE($1, product_name),
        quantity_kg = COALESCE($2, quantity_kg),
        alert_threshold_kg = COALESCE($3, alert_threshold_kg),
        updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [product_name, quantity_kg, alert_threshold_kg, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Produit introuvable" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// DELETE /feed-stock/:id — supprimer un produit
exports.deleteStock = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM feed_stock WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Produit introuvable" });
    }

    res.json({
      message: "Produit supprimé avec succès",
      stock: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};