import { query } from './postgres';
import { v4 as uuidv4 } from 'uuid';

// Simulación básica de autenticación
export const auth = {
  signUp: async ({ email, password, nombre }) => {
    try {
      const userId = uuidv4();
      const result = await query(
        'INSERT INTO users (id, email, passwd, nombre) VALUES ($1, $2, $3, $4) RETURNING *',
        [userId, email, password, nombre]
      );
      return { data: { user: result.rows[0] }, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },
  
  signIn: async ({ email, password }) => {
    try {
      const result = await query(
        'SELECT * FROM users WHERE email = $1 AND passwd = $2',
        [email, password]
      );
      
      if (result.rows.length === 0) {
        return { data: null, error: { message: 'Invalid login credentials' } };
      }
      
      return { 
        data: { 
          session: { 
            user: result.rows[0] 
          } 
        }, 
        error: null 
      };
    } catch (error) {
      return { data: null, error };
    }
  },
  
  signOut: async () => {
    return { error: null };
  },
  
  getSession: async () => {
    // En una implementación real, verificarías un token o cookie
    // Por ahora, devolvemos una sesión vacía
    return { data: { session: null } };
  }
};