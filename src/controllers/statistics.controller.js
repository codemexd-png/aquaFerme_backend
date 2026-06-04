const pool = require("../config/db");

exports.getDashboardStats = async (req, res) => {
  try {
    const ponds = await pool.query(`
      SELECT
        COUNT(*) as total_ponds,
        COALESCE(SUM(current_fish_count),0) as total_fish,
        COALESCE(SUM(max_capacity),0) as total_capacity
      FROM ponds
    `);

    const tasks = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE status='pending') as pending_tasks,
        COUNT(*) FILTER (WHERE status='completed') as completed_tasks
      FROM tasks
    `);

    const stock = await pool.query(`
      SELECT
        COUNT(*) as total_products,
        COALESCE(SUM(quantity_kg),0) as total_stock
      FROM feed_stock
    `);

    const water = await pool.query(`
      SELECT COUNT(*) as total_measurements
      FROM water_quality
    `);

    res.json({
      ponds: ponds.rows[0],
      tasks: tasks.rows[0],
      stock: stock.rows[0],
      water: water.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Erreur serveur",
      error: error.message,
    });
  }
};