import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import authImage from '../../assets/images/auth_image.svg'
import { motion } from 'framer-motion';

const SignUp = () => {
  const navigate = useNavigate();
  const { signUp } = useAuth(); // Changed from signup to signUp to match your auth context
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  useEffect(() => {
    if (redirecting) {
      const timer = setTimeout(() => {
        navigate('/login', {
          state: { message: 'Este correo ya está registrado. Por favor, inicia sesión.' },
          replace: true
        });
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [redirecting, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);

    try {
      await signUp({ email: formData.email, password: formData.password, nombre: formData.email.split('@')[0] }); // Updated to match your auth context format
      navigate('/login', { 
        state: { message: 'Por favor, verifica tu correo electrónico para continuar' }
      });
    } catch (err) {
      setError(err.message);
      if (err.message.includes('ya está registrado')) {
        setRedirecting(true);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center -mt-20">
      <div className="h-[500px] flex gap-16">
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
          <div className="rounded-lg bg-indigo-100 hidden lg:flex items-center justify-center" style={{ height: '500px', width: '500px' }}>
            <div
              className="w-full h-4/5 bg-contain bg-center bg-no-repeat"
              style={{ backgroundImage: "url(" + authImage + ")" }}
            />
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
          <div className="rounded-lg sm:border-2 px-4 lg:px-24 py-16 lg:max-w-xl sm:max-w-md w-full text-center">
            <form onSubmit={handleSubmit}>
              <h1 className="font-bold tracking-wider text-3xl mb-16 w-full text-gray-600">
                Crear cuenta
              </h1>
              {error && (
                <div className={`${redirecting ? 'bg-yellow-100 border-yellow-400 text-yellow-700' : 'bg-red-100 border-red-400 text-red-700'} px-4 py-3 rounded mb-4 border`}>
                  <span className="block sm:inline">{error}</span>
                  {redirecting && (
                    <span className="block text-sm mt-1">Redirigiendo al login...</span>
                  )}
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
              <div className="py-2 text-left">
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="border-2 border-gray-100 focus:outline-none bg-gray-100 block w-full py-2 px-4 rounded-lg focus:border-gray-700"
                  placeholder="Confirmar contraseña"
                  required
                />
              </div>
              <div className="py-2">
                <Button
                  variant="primary"
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? 'Creando cuenta...' : 'Crear cuenta'}
                </Button>
              </div>
              <div className="text-center mt-4">
                <span className="text-sm text-gray-600">
                  ¿Ya tienes una cuenta?{' '}
                  <button 
                    onClick={() => navigate('/login')}
                    className="text-purple-600 hover:text-purple-700 font-semibold"
                  >
                    Inicia sesión aquí
                  </button>
                </span>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SignUp;