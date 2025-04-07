import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Header from "./components/layout/Header";
import Hero from "./components/layout/Hero";
import Footer from "./components/layout/Footer";
import Login from "./components/auth/Login";
import SignUp from "./components/auth/SignUp";
import "./styles/App.css";
import { supabase } from './lib/supabase';
import { useEffect } from 'react';
import AuthLayout from './components/auth/AuthLayout';

export default function App() {
  useEffect(() => {
    async function testConnection() {
      const { data, error } = await supabase.from('users').select('*').limit(1);
      if (error) {
        console.error('Supabase connection error:', error);
      } else {
        console.log('Supabase connection successful:', data);
      }
    }
    
    testConnection();
  }, []);

  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen bg-white">
          <Header />
          <main>
            <Routes>
              <Route path="/" element={<Hero />} />
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<SignUp />} />
              </Route>
            </Routes>
          </main>
          <Footer />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
