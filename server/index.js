const express = require('express');
const cors = require('cors');
const pool = require('./config/database');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

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

// Iniciar servidor
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});