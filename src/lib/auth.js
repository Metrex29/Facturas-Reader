import { v4 as uuidv4 } from 'uuid';

const API_URL = 'http://localhost:3000/api';

// Authentication service using PostgresProvider
export const auth = {
  signUp: async ({ email, password, nombre }) => {
    try {
      const response = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, nombre })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al crear usuario');
      }
      
      const user = await response.json();
      
      Cannot GET /api      // Store user in localStorage
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

      if (!response.ok) {
        const errorData = await response.json();
        return { 
          data: null, 
          error: { message: errorData.message || 'Credenciales incorrectas' } 
        };
      }

      const responseData = await response.json();
      let user, token;
      
      // Handle different response formats
      if (responseData.data) {
        ({ user, token } = responseData.data);
      } else {
        ({ user, token } = responseData);
      }
      
      if (!user || !token) {
        return {
          data: null,
          error: { message: 'Formato de respuesta inválido del servidor' }
        };
      }
      
      // Store user and token in localStorage
      const session = { user, token };
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('session', JSON.stringify(session));
      }
      
      return { 
        data: { 
          session
        }, 
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
          return { data: { session }, error: null };
        } catch (e) {
          window.localStorage.removeItem('session');
        }
      }
    }
    return { data: { session: null }, error: null };
  }
};