import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FaSave, FaKey, FaSignOutAlt, FaUserEdit, FaEnvelope, FaCamera } from 'react-icons/fa';

const API_URL = 'http://localhost:3001/api/users';

const AccountPage = () => {
  const auth = useAuth();
  const user = auth.user;
  const setUser = auth.setUser;
  const logout = auth.logout;
  const [form, setForm] = useState({ nombre: '', email: '', foto_perfil: '' });
  const [fotoPreview, setFotoPreview] = useState(null);
  const [fotoFile, setFotoFile] = useState(null);
  const [passwords, setPasswords] = useState({ actual: '', nueva: '' });
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (user && user.id) {
      axios.get(`${API_URL}/${user.id}`)
        .then(res => {
          setForm({
            nombre: res.data.nombre,
            email: res.data.email,
            foto_perfil: res.data.foto_perfil || ''
          });
          setFotoPreview(res.data.foto_perfil ? `http://localhost:3001${res.data.foto_perfil}` : null);
        })
        .catch(err => {
          if (err.response && err.response.status === 404) {
            setError('Usuario no encontrado. Por favor, vuelve a iniciar sesión.');
          } else {
            setError('Error al cargar datos de usuario');
          }
        });
    }
  }, [user, logout, navigate]);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFotoChange = e => {
    const file = e.target.files[0];
    setFotoFile(file);
    setFotoPreview(file ? URL.createObjectURL(file) : null);
  };

  const handleSave = async e => {
    e.preventDefault();
    setMsg(''); setError('');
    try {
      await axios.put(`${API_URL}/${user.id}`, { nombre: form.nombre, email: form.email });
      if (fotoFile) {
        const fd = new FormData();
        fd.append('foto', fotoFile);
        const res = await axios.post(`${API_URL}/${user.id}/foto`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        setFotoPreview(`http://localhost:3001${res.data.foto_perfil}`);
        setForm(f => ({ ...f, foto_perfil: res.data.foto_perfil }));
      }
      const userRes = await axios.get(`${API_URL}/${user.id}`);
      setUser(u => ({ ...u, ...userRes.data }));
      setError('');
      setMsg('Datos actualizados correctamente');
    } catch (err) {
      if (err.response && err.response.status === 404) {
        setError('Usuario no encontrado. Por favor, vuelve a iniciar sesión.');
      } else {
        setError('');
      }
    }
  };

  const handlePassword = async e => {
    e.preventDefault();
    setMsg(''); setError('');
    try {
      await axios.put(`${API_URL}/${user.id}/password`, passwords);
      setMsg('Contraseña actualizada');
      setPasswords({ actual: '', nueva: '' });
    } catch (err) {
      if (err.response && err.response.status === 404) {
        setError('Usuario no encontrado. Por favor, vuelve a iniciar sesión.');
      } else {
        setError('Error al cambiar contraseña');
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-10">
      <div className="bg-gradient-to-tr from-purple-500 to-blue-400 rounded-2xl shadow-xl p-1 mb-8">
        <div className="bg-white rounded-2xl p-8 flex flex-col items-center relative">
          <div className="relative mb-4">
            <img
              src={fotoPreview || '/default-profile.png'}
              alt="Foto de perfil"
              className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg bg-gray-100"
            />
            <label className="absolute bottom-2 right-2 bg-blue-600 p-2 rounded-full cursor-pointer shadow-lg hover:bg-blue-700 transition">
              <FaCamera className="text-white" />
              <input type="file" accept="image/*" onChange={handleFotoChange} className="hidden" />
            </label>
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-1">{form.nombre || 'Tu nombre'}</h2>
          <p className="text-gray-500 mb-2">{form.email || 'Tu correo'}</p>
        </div>
      </div>

      {msg && <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-3 mb-4 rounded shadow">{msg}</div>}
      {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 mb-4 rounded shadow">{error}</div>}

      <form onSubmit={handleSave} className="bg-white rounded-xl shadow p-6 mb-8 grid gap-6">
        <div>
          <label className="block font-semibold text-gray-700 mb-1 flex items-center gap-2"><FaUserEdit /> Nombre</label>
          <input name="nombre" value={form.nombre} onChange={handleChange} className="w-full border-2 border-gray-200 rounded-lg p-3 focus:outline-none focus:border-blue-400 transition" />
        </div>
        <div>
          <label className="block font-semibold text-gray-700 mb-1 flex items-center gap-2"><FaEnvelope /> Correo</label>
          <input name="email" value={form.email} onChange={handleChange} className="w-full border-2 border-gray-200 rounded-lg p-3 focus:outline-none focus:border-blue-400 transition" />
        </div>
        <button type="submit" className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold shadow transition text-lg"><FaSave /> Guardar cambios</button>
      </form>

      <form onSubmit={handlePassword} className="bg-white rounded-xl shadow p-6 mb-8 grid gap-6">
        <h3 className="text-xl font-bold text-gray-700 mb-2 flex items-center gap-2"><FaKey /> Cambiar contraseña</h3>
        <div>
          <label className="block font-semibold text-gray-700 mb-1">Contraseña actual</label>
          <input type="password" name="actual" value={passwords.actual} onChange={e => setPasswords({ ...passwords, actual: e.target.value })} className="w-full border-2 border-gray-200 rounded-lg p-3 focus:outline-none focus:border-purple-400 transition" />
        </div>
        <div>
          <label className="block font-semibold text-gray-700 mb-1">Nueva contraseña</label>
          <input type="password" name="nueva" value={passwords.nueva} onChange={e => setPasswords({ ...passwords, nueva: e.target.value })} className="w-full border-2 border-gray-200 rounded-lg p-3 focus:outline-none focus:border-purple-400 transition" />
        </div>
        <button type="submit" className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold shadow transition text-lg"><FaKey /> Cambiar contraseña</button>
      </form>

      <button
        onClick={() => { logout(); navigate('/login'); }}
        className="flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-semibold shadow w-full transition text-lg mb-8"
      >
        <FaSignOutAlt /> Cerrar sesión
      </button>
    </div>
  );
};

export default AccountPage; 