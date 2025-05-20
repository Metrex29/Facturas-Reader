require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./config/database');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 3001; // Cambiado a puerto 3001 para evitar conflictos

// Middleware
app.use(cors());

// Configuración para manejar archivos grandes
const MAX_FILE_SIZE = '20mb'; // Aumentamos el límite a 20MB para dar margen
app.use(express.json({ limit: MAX_FILE_SIZE }));
app.use(bodyParser.json({ limit: MAX_FILE_SIZE }));
app.use(bodyParser.urlencoded({ limit: MAX_FILE_SIZE, extended: true }));

// Servir archivos estáticos desde la carpeta uploads
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configuración para manejar errores de tamaño de payload
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 413) {
    console.error('Error de tamaño de payload:', err);
    return res.status(413).json({
      message: 'El archivo es demasiado grande. El tamaño máximo permitido es 20MB.',
      error: 'tamaño_excedido'
    });
  }
  next(err);
});

// Ruta de bienvenida (opcional, puedes quitarla si no la usas)
app.get('/api', (req, res) => {
  res.json({
    status: 'success',
    message: 'Bienvenido a la API de facturasIA'
  });
});

// Registro de usuario
app.post('/api/users', async (req, res) => {
  try {
    const { email, password, nombre } = req.body;
    const result = await pool.query(
      'INSERT INTO users (email, password, nombre) VALUES ($1, $2, $3) RETURNING *',
      [email, password, nombre]
    );
    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') { // Unique violation
      res.status(400).json({ message: 'El usuario ya existe' });
    } else {
      console.error(err);
      res.status(500).json({ message: 'Error del servidor' });
    }
  }
});

// Consulta de usuario por id
app.get('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      res.status(404).json({ message: 'Usuario no encontrado' });
    } else {
      res.json(result.rows[0]);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Login de usuario
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'El email y la contraseña son requeridos'
      });
    }

    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(401).json({
        status: 'error',
        message: 'No existe una cuenta con este email'
      });
    }

    const user = userResult.rows[0];
    if (user.password !== password) {
      return res.status(401).json({
        status: 'error',
        message: 'Contraseña incorrecta'
      });
    }

    // Simulación de token JWT
    const token = 'jwt_' + Math.random().toString(36).substr(2);
    res.json({
      user: {
        id: user.id,
        email: user.email,
        nombre: user.nombre
      },
      token
    });
  } catch (err) {
    console.error('Error en login:', err);
    res.status(500).json({
      status: 'error',
      message: 'Error del servidor al procesar la solicitud'
    });
  }
});

// Importar rutas de facturas
const invoicesRoutes = require('./routes/invoices');
const anonymousInvoicesRoutes = require('./routes/anonymous-invoices');

// Usar las rutas de facturas
app.use('/api/invoices', invoicesRoutes);
app.use('/api/invoices/anonymous', anonymousInvoicesRoutes);

// Endpoint para actualizar una factura
app.put('/api/invoices/:id', async (req, res) => {
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
    console.error('Error al actualizar factura:', err);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Endpoint para eliminar una factura
app.delete('/api/invoices/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM invoices WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      res.status(404).json({ message: 'Factura no encontrada' });
    } else {
      res.json({ message: 'Factura eliminada correctamente' });
    }
  } catch (err) {
    console.error('Error al eliminar factura:', err);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Ruta de prueba para verificar la conexión a la base de datos
app.get('/api/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as current_time');
    res.json({
      status: 'success',
      message: 'Conexión a la base de datos exitosa',
      time: result.rows[0].current_time
    });
  } catch (err) {
    console.error('Error al conectar con la base de datos:', err);
    res.status(500).json({
      status: 'error',
      message: 'Error al conectar con la base de datos',
      error: err.message
    });
  }
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});