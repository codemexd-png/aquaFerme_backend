const pool = require("../config/db");

// =========================
// GET /ponds
// Retourne tous les étangs
// Peut filtrer avec ?category=A ou ?group=Barrage
// =========================
exports.getAllPonds = async (req, res) => {
  try {
    const { group } = req.query;

    let query = "SELECT * FROM ponds";
    const values = [];

    if (group) {
      query += " WHERE pond_group = $1";
      values.push(group);
    }

    query += " ORDER BY id ASC";

    const result = await pool.query(query, values);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({
      message: "Erreur serveur",
      error: error.message,
    });
  }
};

// =========================
// GET /ponds/:id
// Retourne le détail complet d’un étang
// =========================
exports.getPondById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query("SELECT * FROM ponds WHERE id = $1", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Étang introuvable",
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({
      message: "Erreur serveur",
      error: error.message,
    });
  }
};

// =========================
// GET /ponds/:id/stats
// Retourne les stats d’un étang
// current_fish_count
// pourcentage occupation
// dernier avg_weight_g
// =========================
exports.getPondStats = async (req, res) => {
  try {
    const { id } = req.params;

    const pondResult = await pool.query("SELECT * FROM ponds WHERE id = $1", [
      id,
    ]);

    if (pondResult.rows.length === 0) {
      return res.status(404).json({
        message: "Étang introuvable",
      });
    }

    const pond = pondResult.rows[0];

    const weightResult = await pool.query(
      `
      SELECT avg_weight_g
      FROM fish_operations
      WHERE pond_id = $1 AND avg_weight_g IS NOT NULL
      ORDER BY operation_date DESC, id DESC
      LIMIT 1
      `,
      [id],
    );

    // Récupérer les données de nourrissage du jour
    const feedResult = await pool.query(
      `SELECT food_given_kg, food_planned_kg
   FROM daily_feed
   WHERE pond_id = $1 AND feed_date = CURRENT_DATE
   LIMIT 1`,
      [id],
    );

    // Si aucune donnée de nourrissage n'est trouvée, on considère que 0 kg ont été donnés et planifiés
    const foodGiven =
      feedResult.rows.length > 0
        ? parseFloat(feedResult.rows[0].food_given_kg)
        : 0;
    // Si aucune donnée de nourrissage n'est trouvée, on considère que 0 kg sont planifiés
    const foodPlanned =
      feedResult.rows.length > 0
        ? parseFloat(feedResult.rows[0].food_planned_kg)
        : 0;
    const avgWeight =
      weightResult.rows.length > 0 ? weightResult.rows[0].avg_weight_g : null;

    const occupation =
      pond.max_capacity > 0
        ? (pond.current_fish_count / pond.max_capacity) * 100
        : 0;

    //retourne les stats de l'étang
    res.json({
      id: pond.id,
      name: pond.name,
      pond_group: pond.pond_group,
      area_m2: pond.area_m2,
      max_capacity: pond.max_capacity,
      current_fish_count: pond.current_fish_count,
      occupation_percent: Number(occupation.toFixed(1)),
      avg_weight_g: avgWeight,
      food_given_kg: foodGiven,
      food_planned_kg: foodPlanned,
    });
  } catch (error) {
    res.status(500).json({
      message: "Erreur serveur",
      error: error.message,
    });
  }
};
