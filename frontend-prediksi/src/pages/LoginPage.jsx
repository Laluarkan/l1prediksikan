import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { GoogleLogin } from '@react-oauth/google'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://l1prediksikan.my.id/api'

export default function LoginPage({ setUser }) {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
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
        alert(data.detail || "Gagal Login")
      }
    // eslint-disable-next-line no-unused-vars
    } catch (err) {
      alert("Gagal terhubung ke server.")
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: credentialResponse.credential })
      })
      const data = await res.json()
      if (res.ok) {
        localStorage.setItem('token', data.token)
        localStorage.setItem('username', data.username)
        localStorage.setItem('is_admin', data.is_admin) // Simpan status admin
        setUser({ username: data.username, is_admin: data.is_admin })
        navigate('/')
      } else {
        alert(data.detail || "Gagal Autentikasi Google")
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
        <title>Log in | L1PREDIKSIKAN</title>
      </Helmet>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500 uppercase tracking-wider">
          Selamat Datang
        </h2>
        <p className="mt-2 text-center text-sm text-gray-400">
          Atau <Link to="/register" className="font-bold text-indigo-400 hover:text-indigo-300 transition-colors">buat akun baru secara gratis</Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-gray-800 py-8 px-4 shadow-2xl sm:rounded-2xl sm:px-10 border border-gray-700">
          
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Username</label>
              <input 
                type="text" required 
                value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})}
                className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition" 
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Password</label>
              <input 
                type="password" required 
                value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition" 
              />
            </div>

            <button 
              type="submit" disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none transition-colors disabled:opacity-50"
            >
              {loading ? 'MEMPROSES...' : 'LOG IN'}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-700" /></div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-800 text-gray-500 font-medium">Atau lanjutkan dengan</span>
              </div>
            </div>

            <div className="mt-6 flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => alert('Login Google Dibatalkan/Gagal')}
                theme="filled_black"
                shape="pill"
              />
            </div>
          </div>

        </div>
      </div>
    </main>
  )
}