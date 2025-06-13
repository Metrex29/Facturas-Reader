import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { motion } from 'framer-motion';
import authImage from '../../assets/images/auth_image.svg';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const message = location.state?.message;
  const { signIn } = useAuth(); // Cambiado de login a signIn para coincidir con auth.js
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    return () => {
      if (location.state?.message) {
        navigate(location.pathname, { replace: true, state: {} });
      }
    };
  }, [location, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      console.log('Intentando iniciar sesión con:', formData.email);
      const result = await signIn({ email: formData.email, password: formData.password });
      console.log('Resultado del inicio de sesión:', result);
      
      if (result.error) {
        setError(result.error.message || 'Error al iniciar sesión. Por favor, intenta de nuevo.');
        return;
      }
      
      // Verificar si hay una sesión válida en cualquiera de los formatos posibles
      if (result.data?.session?.user || result.session?.user || result.user) {
        console.log('Sesión iniciada correctamente, redirigiendo a dashboard');
        // Forzar una pequeña espera para asegurar que los datos se guarden correctamente
        setTimeout(() => {
          navigate('/dashboard');
        }, 100);
      } else {
        console.error('Formato de respuesta inesperado:', result);
        setError('Error al iniciar sesión. Por favor, intenta de nuevo.');
      }
    } catch (err) {
      console.error('Error en el inicio de sesión:', err);
      setError(err.message || 'Error inesperado al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-96px)] flex flex-col items-center justify-center">
      <div className="h-[500px] flex gap-16 items-center justify-center">
        <motion.div
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '-100%', opacity: 0 }}
          transition={{ 
            type: "tween",
            duration: 0.4,
            ease: "easeInOut"
          }}
          className="flex-1 flex items-center justify-center"
        >
          <div className="rounded-lg sm:border-2 px-4 lg:px-24 py-16 lg:max-w-xl sm:max-w-md w-full text-center">
            <form onSubmit={handleSubmit}>
              <h1 className="font-bold tracking-wider text-3xl mb-16 w-full text-gray-600">
                Iniciar sesion
              </h1>
              {message && (
                <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
                  <span className="block sm:inline">{message}</span>
                </div>
              )}
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                  <span className="block sm:inline">{error}</span>
                </div>
              )}
              <div className="py-2 text-left">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="border-2 border-gray-100 focus:outline-none bg-gray-100 block w-full py-2 px-4 rounded-lg focus:border-gray-700"
                  placeholder="tuCorreo@ejemplo.com"
                  required
                />
              </div>
              <div className="py-2 text-left">
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="border-2 border-gray-100 focus:outline-none bg-gray-100 block w-full py-2 px-4 rounded-lg focus:border-gray-700"
                  placeholder="Contraseña"
                  required
                />
              </div>
              <div className="py-2">
                <Button
                  variant="primary"
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
                </Button>
              </div>
              <div className="text-center mt-4">
                <span className="text-sm text-gray-600">
                  ¿No tienes cuenta?{' '}
                  <button 
                    onClick={() => navigate('/signup')}
                    className="text-purple-600 hover:text-purple-700 font-semibold"
                  >
                    Regístrate aquí
                  </button>
                </span>
              </div>
            </form>
          </div>
        </motion.div>
        <motion.div
          initial={{ x: '-100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ 
            type: "tween",
            duration: 0.4,
            ease: "easeInOut"
          }}
          className="flex-1 flex items-center justify-center"
        >
          <div className="rounded-lg bg-indigo-100 hidden lg:flex items-center justify-center" style={{ height: '500px', width: '500px' }}>
            <div
              className="w-full h-4/5 bg-contain bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${authImage})` }}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;