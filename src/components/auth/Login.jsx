import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import authImage from '../../assets/images/auth_image.svg'
import { motion } from 'framer-motion';



const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const message = location.state?.message;
  const { login } = useAuth();

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
      await login(formData.email, formData.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center -mt-20">
      <div className="h-[500px] flex gap-16">
        <motion.div
          initial={{ x: '-100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ duration: 0.5 }}
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
                  <a href="/signup" className="text-purple-600 hover:text-purple-700 font-semibold">
                    Regístrate aquí
                  </a>
                </span>
              </div>
              <p className="mt-6 text-xs text-gray-600 text-center">
                I agree to abide by templatana's
                <a href="#" className="border-b border-gray-500 border-dotted ml-1">
                  Terms of Service
                </a>
                {' '}and its{' '}
                <a href="#" className="border-b border-gray-500 border-dotted">
                  Privacy Policy
                </a>
              </p>
            </form>
          </div>
        </motion.div>
        <motion.div
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '-100%', opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="flex-1 flex items-center justify-center"
        >
          <div className="rounded-lg bg-indigo-100 hidden lg:flex items-center justify-center" style={{ height: '500px', width: '500px' }}>
            <div
              className="w-full h-4/5 bg-contain bg-center bg-no-repeat"
              style={{ backgroundImage: "url(" + authImage + ")" }}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;