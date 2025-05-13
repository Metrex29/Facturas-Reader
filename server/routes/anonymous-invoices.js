const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const multer = require('multer');
const path = require('path');

// Configuración de almacenamiento para archivos
const storage = multer.diskStorage({
  destination: './uploads',
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname.replace(/\s/g, '_');
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

// Endpoint para subir facturas anónimas (sin requerir autenticación)
router.post('/', upload.single('file'), async (req, res) => {
  console.log('Recibiendo solicitud de factura anónima');
  try {
    const { date, amount, description } = req.body;
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({ message: 'No se ha proporcionado ningún archivo' });
    }
    
    // Crear la URL del archivo guardado
    const filePath = `/uploads/${file.filename}`;
    
    // Insertar en la base de datos con user_id NULL
    const result = await pool.query(
      'INSERT INTO invoices (user_id, date, amount, description, file_name, file_url) VALUES (NULL, $1, $2, $3, $4, $5) RETURNING *',
      [date, amount, description, file.originalname, filePath]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error al subir factura anónima:', err);
    res.status(500).json({ message: 'Error del servidor al procesar el archivo' });
  }
});

// Mantener endpoint de compatibilidad para aplicaciones que aún usan la ruta /upload-blob
router.post('/upload-blob', upload.single('file'), async (req, res) => {
  try {
    const { date, amount, description } = req.body;
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({ message: 'No se ha proporcionado ningún archivo' });
    }
    
    // Crear la URL del archivo guardado
    const filePath = `/uploads/${file.filename}`;
    
    const result = await pool.query(
      'INSERT INTO invoices (user_id, date, amount, description, file_name, file_url) VALUES (NULL, $1, $2, $3, $4, $5) RETURNING *',
      [date, amount, description, file.originalname, filePath]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error al subir archivo anónimo:', err);
    res.status(500).json({ message: 'Error del servidor al procesar el archivo' });
  }
});

// Endpoint para obtener un archivo
router.get('/file/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '../uploads', filename);
  res.sendFile(filePath);
});

module.exports = router;