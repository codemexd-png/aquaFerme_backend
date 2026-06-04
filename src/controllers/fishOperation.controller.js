// Ce fichier contient la logique métier pour les opérations sur les poissons.
// Il gère deux fonctions : créer une opération et récupérer l'historique d'un étang.
//
// Types d'opérations possibles :
//   - addition  : ajout de poissons dans un étang → current_fish_count augmente
//   - mortality : mortalité de poissons          → current_fish_count diminue
//   - transfer  : transfert vers un autre étang  → diminue pond_id, augmente target_pond_id
//   - control   : contrôle sans changement de quantité
//
// ⚠️ Le trigger PostgreSQL (défini dans schema.sql) met à jour automatiquement
//    ponds.current_fish_count après chaque INSERT dans fish_operations.
//    Il n'y a donc rien à faire manuellement pour ça dans le controller.

const pool = require('../config/db');

// Crée une nouvelle opération sur les poissons dans un étang.
// Le trigger SQL met à jour automatiquement current_fish_count dans ponds après l'INSERT.
const addOperation = async (req, res) => {
    const { pond_id, operation_type, operation_date, fish_count, avg_weight_g, target_pond_id, notes } = req.body;
    const user_id = req.user.id;

    // Validation : ces 4 champs sont toujours requis
    if (!pond_id || !operation_type || !operation_date || !fish_count) {
        return res.status(400).json({ error: 'Les champs pond_id, operation_type, operation_date et fish_count sont obligatoires' });
    }

    // Validation spéciale : pour un transfert, l'étang de destination est obligatoire
    if (operation_type === 'transfer' && !target_pond_id) {
        return res.status(400).json({ error: 'target_pond_id est obligatoire pour un transfert' });
    }

    try {
        // RETURNING * renvoie la ligne insérée complète, pratique pour confirmer au frontend
        const result = await pool.query(
            `INSERT INTO fish_operations (pond_id, user_id, operation_type, operation_date, fish_count, avg_weight_g, target_pond_id, notes)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING *`,
            [pond_id, user_id, operation_type, operation_date, fish_count, avg_weight_g || null, target_pond_id || null, notes || null]
        );

        // 201 Created = ressource créée avec succès
        res.status(201).json({ operation: result.rows[0] });
    } catch (error) {
        console.error('Erreur lors de la création de l\'opération :', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// Retourne l'historique des opérations d'un étang.
// Le paramètre pond_id est obligatoire et passé en query string : GET /fish-operations?pond_id=1
// Les résultats sont triés du plus récent au plus ancien.
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
