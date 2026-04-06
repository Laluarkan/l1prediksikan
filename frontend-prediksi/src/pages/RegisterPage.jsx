import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api'

export default function RegisterPage({ setUser }) {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({ username: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)

  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      const data = await res.json()
      if (res.ok) {
        localStorage.setItem('token', data.token)
        localStorage.setItem('username', data.username)
        localStorage.setItem('is_admin', data.is_admin) // Simpan status admin
        setUser({ username: data.username, is_admin: data.is_admin })
        navigate('/')
      } else {
        alert(data.detail || "Gagal Registrasi")
      }
    // eslint-disable-next-line no-unused-vars
    } catch (err) {
      alert("Gagal terhubung ke server.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-[80vh] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <Helmet>
        <title>Buat Akun | L1PREDIKSIKAN</title>
      </Helmet>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500 uppercase tracking-wider">
          Buat Akun Baru
        </h2>
        <p className="mt-2 text-center text-sm text-gray-400">
          Sudah punya akun? <Link to="/login" className="font-bold text-indigo-400 hover:text-indigo-300 transition-colors">Log in di sini</Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-gray-800 py-8 px-4 shadow-2xl sm:rounded-2xl sm:px-10 border border-gray-700">
          
          <form className="space-y-5" onSubmit={handleRegister}>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Username</label>
              <input 
                type="text" required 
                value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})}
                className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition" 
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Email</label>
              <input 
                type="email" required 
                value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition" 
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Password</label>
              <input 
                type="password" required minLength="6"
                value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition" 
              />
            </div>

            <button 
              type="submit" disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none transition-colors disabled:opacity-50 mt-4"
            >
              {loading ? 'MEMPROSES...' : 'DAFTAR SEKARANG'}
            </button>
          </form>

        </div>
      </div>
    </main>
  )
}