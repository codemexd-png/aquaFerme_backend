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