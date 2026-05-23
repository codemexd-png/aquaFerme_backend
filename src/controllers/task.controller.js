const pool = require('../config/db');

// Crée une nouvelle tâche dans le planning.
const addTask = async (req, res) => {
    const { pond_id, title, description, priority, task_date } = req.body;
    const user_id = req.user.id;

    // Validation des champs obligatoires
    if (!title || !priority || !task_date) {
        return res.status(400).json({ error: 'Les champs title, priority et task_date sont obligatoires' });
    }

    try {
        const result = await pool.query(
            `INSERT INTO tasks (user_id, pond_id, title, description, priority, task_date)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [user_id, pond_id || null, title, description || null, priority, task_date]
        );

        res.status(201).json({ task: result.rows[0] });
    } catch (error) {
        console.error('Erreur lors de la création de la tâche :', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// Retourne les tâches avec filtres optionnels : ?date=2026-05-23 et/ou ?user_id=1.
// Sans filtre, retourne toutes les tâches triées par date.
const getTasks = async (req, res) => {
    const { date, user_id } = req.query;

    // On construit la requête dynamiquement selon les filtres fournis
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

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    try {
        const result = await pool.query(
            `SELECT * FROM tasks ${whereClause} ORDER BY task_date ASC, priority ASC`,
            params
        );

        res.json({ tasks: result.rows });
    } catch (error) {
        console.error('Erreur lors de la récupération des tâches :', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// Met à jour le statut d'une tâche (pending → completed ou l'inverse).
const updateTaskStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    // Validation du statut fourni
    if (!status || !['pending', 'completed'].includes(status)) {
        return res.status(400).json({ error: 'Le statut doit être "pending" ou "completed"' });
    }

    try {
        const result = await pool.query(
            `UPDATE tasks SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
            [status, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Tâche non trouvée' });
        }

        res.json({ task: result.rows[0] });
    } catch (error) {
        console.error('Erreur lors de la mise à jour du statut :', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

module.exports = { addTask, getTasks, updateTaskStatus };
