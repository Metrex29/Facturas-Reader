const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');

// Configuración de multer para fotos de perfil
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = './uploads/perfiles';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + '-' + file.fieldname + ext);
  }
});
const upload = multer({ storage });

// Obtener datos del usuario
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT id, email, nombre, foto_perfil, created_at FROM users WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener usuario', details: err.message });
  }
});

// Actualizar nombre y correo
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, email } = req.body;
    const result = await pool.query('UPDATE users SET nombre = $1, email = $2 WHERE id = $3 RETURNING id, email, nombre, foto_perfil, created_at', [nombre, email, id]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar usuario', details: err.message });
  }
});

// Cambiar contraseña
router.put('/:id/password', async (req, res) => {
  try {
    const { id } = req.params;
    const { actual, nueva } = req.body;
    const user = await pool.query('SELECT password FROM users WHERE id = $1', [id]);
    if (user.rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    const match = await bcrypt.compare(actual, user.rows[0].password);
    if (!match) return res.status(400).json({ error: 'Contraseña actual incorrecta' });
    const hash = await bcrypt.hash(nueva, 10);
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hash, id]);
    res.json({ success: true, message: 'Contraseña actualizada' });
  } catch (err) {
    res.status(500).json({ error: 'Error al cambiar contraseña', details: err.message });
  }
});

// Subir/cambiar foto de perfil
router.post('/:id/foto', upload.single('foto'), async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Intentando subir foto para usuario ID:', id);
    if (!req.file) return res.status(400).json({ error: 'No se subió ninguna foto' });
    // Verificar si el usuario existe antes de actualizar
    const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [id]);
    if (userCheck.rows.length === 0) {
      console.log('Usuario no encontrado para ID:', id);
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    const fileUrl = '/uploads/perfiles/' + req.file.filename;
    await pool.query('UPDATE users SET foto_perfil = $1 WHERE id = $2', [fileUrl, id]);
    console.log('Foto actualizada correctamente para usuario ID:', id);
    res.json({ success: true, foto_perfil: fileUrl });
  } catch (err) {
    console.error('Error al subir foto:', err);
    res.status(500).json({ error: 'Error al subir foto', details: err.message });
  }
});

module.exports = router; 