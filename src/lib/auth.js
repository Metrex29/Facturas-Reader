import { v4 as uuidv4 } from 'uuid';

const API_URL = 'http://localhost:3001/api';

// Authentication service using PostgresProvider
export const auth = {
  signUp: async ({ email, password, nombre }) => {
    try {
      const response = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, nombre })
      });
      
      const responseData = await response.json();
      
      if (!response.ok || responseData.status === 'error') {
        throw new Error(responseData.message || 'Error al crear usuario');
      }
      
      const user = responseData.user || responseData;
      
      // Store user in localStorage
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('user', JSON.stringify(user));
      }
      
      return { data: { user }, error: null };
    } catch (error) {
      console.error('Signup error:', error);
      if (error.message === 'El usuario ya existe') {
        return { 
          data: null, 
          error: { message: 'Este correo ya está registrado. Por favor, inicia sesión.' } 
        };
      }
      return { data: null, error };
    }
  },
  
  signIn: async ({ email, password }) => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const responseData = await response.json();
      
      // Verificar si hay un error en la respuesta
      if (!response.ok || responseData.status === 'error') {
        return { 
          data: null, 
          error: { message: responseData.message || 'Credenciales incorrectas' } 
        };
      }

      let user, token;
      
      // Handle different response formats
      if (responseData.data) {
        ({ user, token } = responseData.data);
      } else {
        ({ user, token } = responseData);
      }
      
      if (!user || !token) {
        console.error('Respuesta del servidor:', responseData);
        return {
          data: null,
          error: { message: 'Formato de respuesta inválido del servidor' }
        };
      }
      
      // Store user and token in localStorage
      const session = { user, token };
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('session', JSON.stringify(session));
        console.log('Sesión guardada:', session);
      }
      
      // Asegurar que la estructura de respuesta sea consistente
      return { 
        data: { 
          session
        },
        // Agregar propiedades adicionales para compatibilidad con diferentes formatos
        session,
        user: session.user,
        error: null 
      };
    } catch (error) {
      console.error('Signin error:', error);
      return { data: null, error };
    }
  },
  
  signOut: async () => {
    // Remove session from localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem('session');
    }
    return { error: null };
  },
  
  getSession: async () => {
    // For local auth in browser, we can check localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      const storedSession = window.localStorage.getItem('session');
      if (storedSession) {
        try {
          const session = JSON.parse(storedSession);
          console.log('Sesión recuperada:', session);
          return { data: { session }, error: null };
        } catch (e) {
          console.error('Error al parsear la sesión:', e);
          window.localStorage.removeItem('session');
        }
      }
    }
    return { data: { session: null }, error: null };
  }
};