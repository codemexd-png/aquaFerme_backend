// Ce fichier contient la logique métier pour la gestion des tâches (planning).
// Il gère trois fonctions :
//   - addTask          : créer une nouvelle tâche
//   - getTasks         : lister les tâches avec filtres optionnels (date, user_id)
//   - updateTaskStatus : marquer une tâche comme 'completed' ou 'pending'
//
// Priorités possibles : 'haute', 'moyenne', 'basse'
// Statuts possibles   : 'pending' (en attente), 'completed' (terminée)
// pond_id est optionnel : une tâche peut ne pas être liée à un étang spécifique.

const pool = require("../config/db");

// Crée une nouvelle tâche dans le planning.
const addTask = async (req, res) => {
  const { pond_id, assigned_to, title, description, priority, task_date } =
    req.body;
  const user_id = req.user.id;

  // title, priority et task_date sont obligatoires
  // pond_id et description sont optionnels
  if (!title || !priority || !task_date) {
    return res.status(400).json({
      error: "Les champs title, priority et task_date sont obligatoires",
    });
  }

  try {
    const result = await pool.query(
      `INSERT INTO tasks (user_id, assigned_to, pond_id, title, description, priority, task_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        user_id,
        assigned_to || null,
        pond_id || null,
        title,
        description || null,
        priority,
        task_date,
      ],
    );

    await pool.query(
      `INSERT INTO notifications (user_id, message)

      VALUES ($1, $2)`,

      [assigned_to || user_id, `Nouvelle tâche créée : ${title}`],
    );

    res.status(201).json({ task: result.rows[0] });
  } catch (error) {
    console.error("Erreur lors de la création de la tâche :", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// Retourne les tâches avec filtres optionnels.
// Exemples d'appels :
//   GET /tasks                          → toutes les tâches
//   GET /tasks?date=2026-05-23          → tâches d'un jour précis
//   GET /tasks?user_id=1               → tâches d'un utilisateur
//   GET /tasks?date=2026-05-23&user_id=1 → combinaison des deux filtres
// Résultats triés par date puis priorité.
const getTasks = async (req, res) => {
  const { date, user_id, assigned_to } = req.query;

  // On construit la requête dynamiquement pour éviter d'écrire plusieurs versions de la même requête.
  // On ajoute des conditions selon les paramètres reçus.
  const conditions = [];
  const params = [];

  if (date) {
    params.push(date);
    conditions.push(`task_date = $${params.length}`);
  }

  if (user_id) {
    params.push(user_id);
    conditions.push(`user_id = $${params.length}`);
  }

  // Si assigned_to est fourni, on ajoute aussi ce filtre
  if (assigned_to) {
    params.push(assigned_to);
    conditions.push(`assigned_to = $${params.length}`);
  }
  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  try {
    const result = await pool.query(
      `SELECT * FROM tasks ${whereClause} ORDER BY task_date ASC,
  CASE priority
    WHEN 'haute' THEN 1
    WHEN 'moyenne' THEN 2
    WHEN 'basse' THEN 3
    ELSE 4
  END ASC`,
      params,
    );

    res.json({ tasks: result.rows });
  } catch (error) {
    console.error("Erreur lors de la récupération des tâches :", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// Met à jour le statut d'une tâche (pending → completed ou l'inverse).
// PATCH /tasks/:id/status — on n'envoie que le statut, pas toute la tâche.
// updated_at est mis à jour automatiquement avec NOW().
const updateTaskStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  // Validation du statut fourni
  if (!status || !["pending", "completed"].includes(status)) {
    return res
      .status(400)
      .json({ error: 'Le statut doit être "pending" ou "completed"' });
  }

  try {
    const result = await pool.query(
      `UPDATE tasks SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [status, id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Tâche non trouvée" });
    }

    res.json({ task: result.rows[0] });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du statut :", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

const updateTask = async (req, res) => {
  const { id } = req.params;
  const { pond_id, title, description, priority, task_date, status } = req.body;

  try {
    const result = await pool.query(
      `
      UPDATE tasks
      SET
        pond_id = COALESCE($1, pond_id),
        title = COALESCE($2, title),
        description = COALESCE($3, description),
        priority = COALESCE($4, priority),
        task_date = COALESCE($5, task_date),
        status = COALESCE($6, status),
        updated_at = NOW()
      WHERE id = $7
      RETURNING *
      `,
      [pond_id, title, description, priority, task_date, status, id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Tâche non trouvée" });
    }

    res.json({ task: result.rows[0] });
  } catch (error) {
    console.error("Erreur modification tâche :", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

const deleteTask = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "DELETE FROM tasks WHERE id = $1 RETURNING *",
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Tâche non trouvée" });
    }

    res.json({
      message: "Tâche supprimée avec succès",
      task: result.rows[0],
    });
  } catch (error) {
    console.error("Erreur suppression tâche :", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

module.exports = {
  addTask,
  getTasks,
  updateTaskStatus,
  updateTask,
  deleteTask,
};
