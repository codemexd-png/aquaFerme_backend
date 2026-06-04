const pool = require('../config/db');

const addOperation = async (req, res) => {
    const { pond_id, operation_type, operation_date, fish_count, avg_weight_g, target_pond_id, notes } = req.body;
    const user_id = req.user.id;

    if (!pond_id || !operation_type || !operation_date || !fish_count) {
        return res.status(400).json({ error: 'Les champs pond_id, operation_type, operation_date et fish_count sont obligatoires' });
    }
    if (operation_type === 'transfer' && !target_pond_id) {
        return res.status(400).json({ error: 'target_pond_id est obligatoire pour un transfert' });
    }

    try {
        const result = await pool.query(
            `INSERT INTO fish_operations (pond_id, user_id, operation_type, operation_date, fish_count, avg_weight_g, target_pond_id, notes)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING *`,
            [pond_id, user_id, operation_type, operation_date, fish_count, avg_weight_g || null, target_pond_id || null, notes || null]
        );
        res.status(201).json({ operation: result.rows[0] });
    } catch (error) {
        console.error('Erreur addOperation:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

const getOperations = async (req, res) => {
  const { pond_id } = req.query;

  try {
    let result;

    if (pond_id) {
      result = await pool.query(
        `SELECT * FROM fish_operations 
         WHERE pond_id = $1 
         ORDER BY operation_date DESC`,
        [pond_id]
      );
    } else {
      result = await pool.query(
        `SELECT * FROM fish_operations 
         ORDER BY operation_date DESC`
      );
    }

    res.json({ operations: result.rows });
  } catch (error) {
    console.error("Erreur lors de la récupération des opérations :", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

const updateOperation = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      pond_id,
      operation_type,
      operation_date,
      fish_count,
      avg_weight_g,
      target_pond_id,
      notes,
    } = req.body;

    const result = await pool.query(
      `
      UPDATE fish_operations
      SET
        pond_id = COALESCE($1, pond_id),
        operation_type = COALESCE($2, operation_type),
        operation_date = COALESCE($3, operation_date),
        fish_count = COALESCE($4, fish_count),
        avg_weight_g = COALESCE($5, avg_weight_g),
        target_pond_id = COALESCE($6, target_pond_id),
        notes = COALESCE($7, notes)
      WHERE id = $8
      RETURNING *
      `,
      [
        pond_id,
        operation_type,
        operation_date,
        fish_count,
        avg_weight_g,
        target_pond_id,
        notes,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Opération introuvable" });
    }

    res.json({ operation: result.rows[0] });
  } catch (error) {
    console.error("Erreur modification opération :", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

const deleteOperation = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM fish_operations WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Opération introuvable" });
    }

    res.json({
      message: "Opération supprimée avec succès",
      operation: result.rows[0],
    });
  } catch (error) {
    console.error("Erreur suppression opération :", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

module.exports = {
  addOperation,
  getOperations,
  updateOperation,
  deleteOperation,
};
