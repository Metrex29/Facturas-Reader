const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Obtener todas las facturas de un usuario
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await pool.query(
      'SELECT * FROM invoices WHERE user_id = $1 ORDER BY date DESC',
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Crear una nueva factura
router.post('/', async (req, res) => {
  try {
    const { user_id, file_url, date, amount, description } = req.body;
    const result = await pool.query(
      'INSERT INTO invoices (user_id, file_url, date, amount, description) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [user_id, file_url, date, amount, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Actualizar una factura
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, description } = req.body;
    const result = await pool.query(
      'UPDATE invoices SET amount = $1, description = $2 WHERE id = $3 RETURNING *',
      [amount, description, id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ message: 'Factura no encontrada' });
    } else {
      res.json(result.rows[0]);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Eliminar una factura
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM invoices WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      res.status(404).json({ message: 'Factura no encontrada' });
    } else {
      res.json({ message: 'Factura eliminada exitosamente' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

module.exports = router;