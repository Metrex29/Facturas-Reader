import { supabase } from '../../lib/supabase';

export const authService = {
  async signUp(email, password) {
    try {
      // First check if the user exists in auth
      const { data: authUser } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authUser?.user) {
        throw new Error('Este correo ya está registrado. Por favor, inicia sesión.');
      }

      // If we get here, try to create the new user
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            email,
            created_at: new Date().toISOString()
          }
        }
      });

      if (signUpError) {
        if (signUpError.message.includes('User already registered')) {
          throw new Error('Este correo ya está registrado. Por favor, inicia sesión.');
        }
        throw signUpError;
      }

      // If we get here, the signup was successful
      if (!data?.user) {
        throw new Error('Error durante el registro. Por favor, inténtalo de nuevo.');
      }

      return { data };
    } catch (error) {
      console.error('Signup error:', error);
      if (error.message.includes('already registered') || error.message.includes('ya está registrado')) {
window.location.href = '/login';
      }
      throw error;
    }
  },

  async signIn({ email, password }) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Email o contraseña incorrectos');
        }
        throw new Error('Error durante el inicio de sesión. Por favor, inténtalo de nuevo.');
      }

      return { data };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw new Error('Error al cerrar sesión. Por favor, inténtalo de nuevo.');
      }
    } catch (error) {
      console.error('Signout error:', error);
      throw error;
    }
  }
};