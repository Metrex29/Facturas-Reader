import { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../lib/auth';

const AuthContext = createContext({});

// En tu AuthContext.jsx, añade un alias para signIn
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Simulación de escucha de cambios en la autenticación
    const checkAuth = () => {
      // En una implementación real, verificarías si el usuario sigue autenticado
    };

    const interval = setInterval(checkAuth, 10000);
    return () => clearInterval(interval);
  }, []);

  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    signUp: async (data) => {
      try {
        setLoading(true);
        const { error, data: userData } = await auth.signUp(data);
        if (error) throw error;
        setUser(userData.user);
        return userData;
      } catch (err) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    signIn: async (data) => {
      try {
        setLoading(true);
        const { error, data: userData } = await auth.signIn(data);
        
        if (error) {
          console.error('Error en AuthContext.signIn:', error);
          setError(error.message || 'Error al iniciar sesión');
          return { error };
        }
        
        console.log('Datos de usuario recibidos en AuthContext:', userData);
        
        // Manejar múltiples formatos posibles de respuesta
        if (userData?.session?.user) {
          setUser(userData.session.user);
        } else if (userData?.user) {
          // Formato alternativo de respuesta
          setUser(userData.user);
        } else if (userData?.data?.session?.user) {
          // Otro formato posible
          setUser(userData.data.session.user);
        } else {
          console.error('Formato de respuesta inesperado en AuthContext:', userData);
          setError('Formato de respuesta inválido');
          return { error: { message: 'Formato de respuesta inválido' } };
        }
        
        return userData;
      } catch (err) {
        console.error('Excepción en AuthContext.signIn:', err);
        setError(err.message || 'Error inesperado');
        return { error: { message: err.message || 'Error inesperado' } };
      } finally {
        setLoading(false);
      }
    },
    signOut: async () => {
      try {
        setLoading(true);
        const { error } = await auth.signOut();
        if (error) throw error;
        setUser(null);
      } catch (err) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    }
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  return useContext(AuthContext);
};
