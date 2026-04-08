import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate, Navigate } from 'react-router-dom'
import { HelmetProvider, Helmet } from 'react-helmet-async'
import { GoogleOAuthProvider } from '@react-oauth/google'
import HomePage from './pages/HomePage'
import PredictPage from './pages/PredictPage'
import AdminPage from './pages/AdminPage'
import PerformancePage from './pages/PerformancePage'
import FixturePage from './pages/FixturePage'
import BlogPage from './pages/BlogPage'
import ArticleDetailPage from './pages/ArticleDetailPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import TrackerPage from './pages/TrackerPage'
import LeaderboardPage from './pages/LeaderboardPage'
// Tambahkan baris ini di bagian atas file
import logoImage from './assets/image.png';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'MASUKKAN_CLIENT_ID'
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://l1prediksikan.my.id/api'
const GA_TRACKING_ID = 'G-EWE1G8SFNR' // ID Google Analytics kamu

function GoogleAnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    // Memastikan gtag sudah diload di index.html
    if (typeof window.gtag === 'function') {
      window.gtag('config', GA_TRACKING_ID, {
        page_path: location.pathname + location.search,
      });
    }
  }, [location]); // useEffect ini akan jalan tiap kali 'location' berubah

  return null; // Komponen ini tidak me-render apa-apa di UI
}

function Navigation({ user, handleLogout }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMobileMenuOpen(false)
  }, [location.pathname])

  const navLinks = [
    { name: 'Beranda', path: '/' },
    { name: 'Prediksi', path: '/predict' },
    { name: 'Jadwal', path: '/fixtures' },
    { name: 'Performa', path: '/performance' },
    { name: 'Blog', path: '/blog' },
    { name: 'Peringkat', path: '/leaderboard' },
  ]

  if (user) {
    navLinks.push({ name: 'Portofolio', path: '/tracker' })
  }
  if (user?.is_admin) {
    navLinks.push({ name: 'Admin DB', path: '/admin' })
  }

  const onLogoutClick = () => {
    handleLogout()
    navigate('/login')
  }

  return (
    <header className="bg-gray-950 border-b border-gray-800 sticky top-0 z-50">
      <nav aria-label="Global" className="mx-auto flex max-w-7xl items-center justify-between p-4 lg:px-8">
        
        <div className="flex lg:flex-1">
          <Link to="/" className="-m-1.5 p-1.5 flex items-center gap-3 group">
            <span className="sr-only">L1PREDIKSI-KAN</span>
            <img src={logoImage} alt="L1 Logo" className="h-9 w-9 md:h-10 md:w-10 rounded-full object-cover group-hover:scale-110 transition-transform shadow-[0_0_12px_rgba(59,130,246,0.6)]"/>
            <span className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500 tracking-wider uppercase hidden sm:block">
              L1PREDIKSI-KAN
            </span>
          </Link>
        </div>

        <div className="hidden lg:flex lg:gap-x-6 items-center justify-center flex-wrap">
          {navLinks.map((link) => {
            const isActive = link.path === '/' 
              ? location.pathname === '/' 
              : location.pathname.startsWith(link.path);
              
            return (
              <Link 
                key={link.name}
                to={link.path} 
                className={`text-xs md:text-sm/6 font-semibold uppercase tracking-wide transition-colors ${isActive ? 'text-indigo-400' : 'text-gray-300 hover:text-white'}`}
              >
                {link.name}
              </Link>
            )
          })}
        </div>

        <div className="flex items-center gap-4 lg:flex-1 lg:justify-end">
          <button 
            type="button" 
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden -m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-400 hover:text-white transition-colors"
          >
            <span className="sr-only">Buka menu utama</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="size-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>

          <div className="hidden lg:flex items-center gap-4">
            {user ? (
              <>
                <div className="flex flex-col items-end">
                  <span className="text-xs font-bold text-gray-300 truncate max-w-[120px]">
                    Hi, <span className="text-indigo-400">{user.username}</span>
                    {user.is_admin && <span className="ml-2 bg-red-500/20 text-red-400 text-[9px] px-1.5 py-0.5 rounded border border-red-500/30">ADMIN</span>}
                  </span>
                  {/* PENAMBAHAN: Menampilkan saldo koin */}
                  {user.balance !== undefined && (
                    <span className="text-[10px] font-black text-yellow-400 mt-0.5">
                      🪙 {user.balance.toLocaleString()}
                    </span>
                  )}
                </div>
                <button onClick={onLogoutClick} className="rounded bg-gray-800 border border-gray-700 px-3 py-1.5 text-xs font-semibold text-gray-300 hover:bg-gray-700 transition-colors">
                  Log out
                </button>
              </>
            ) : (
              <Link to="/login" className="inline-flex items-center justify-center gap-x-2.5 rounded bg-indigo-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-indigo-500 shadow-sm transition-colors">
                Log in
                <span aria-hidden="true">&rarr;</span>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {mobileMenuOpen && (
        <div className="lg:hidden relative z-50">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}></div>
          
          <div className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-gray-900 p-6 sm:max-w-sm border-l border-gray-800 shadow-2xl transition-transform duration-300 flex flex-col">
            
            <div className="flex items-center justify-between border-b border-gray-800 pb-4">
              <Link to="/" onClick={() => setMobileMenuOpen(false)} className="-m-1.5 p-1.5 flex items-center gap-2">
                <img src={logoImage} alt="L1 Logo" className="h-9 w-9 md:h-10 md:w-10 rounded-full object-cover group-hover:scale-110 transition-transform shadow-[0_0_12px_rgba(59,130,246,0.6)]"/>
                <span className="text-lg font-black text-white uppercase tracking-wider">L1PREDIKSI-KAN</span>
              </Link>
              <button 
                type="button" 
                onClick={() => setMobileMenuOpen(false)}
                className="-m-2.5 rounded-md p-2.5 text-gray-400 hover:text-white transition-colors"
              >
                <span className="sr-only">Tutup menu</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="size-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mt-6 flow-root flex-grow">
              <div className="-my-6 divide-y divide-gray-800">
                <div className="space-y-2 py-6">
                  {navLinks.map((link) => {
                    const isActive = link.path === '/' 
                      ? location.pathname === '/' 
                      : location.pathname.startsWith(link.path);
                      
                    return (
                      <Link 
                        key={link.name}
                        to={link.path} 
                        className={`block rounded-lg px-3 py-2 text-base/7 font-semibold uppercase tracking-wide transition-colors ${isActive ? 'text-indigo-400 bg-indigo-500/10' : 'text-gray-300 hover:text-white hover:bg-gray-800'}`}
                      >
                        {link.name}
                      </Link>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="mt-auto pt-6 border-t border-gray-800 space-y-3">
              {user ? (
                <>
                  <div className="text-center mb-4 text-sm font-bold text-gray-300 flex flex-col items-center">
                    <div>Hi, <span className="text-indigo-400">{user.username}</span></div>
                    {/* PENAMBAHAN: Menampilkan saldo koin di mobile menu */}
                    {user.balance !== undefined && (
                      <span className="text-xs font-black text-yellow-400 mt-1">🪙 {user.balance.toLocaleString()} Koin</span>
                    )}
                    {user.is_admin && <span className="block mt-1 text-red-400 text-[10px]">MODE ADMIN AKTIF</span>}
                  </div>
                  <button onClick={onLogoutClick} className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2.5 text-center text-base/7 font-semibold text-gray-300 hover:text-white hover:bg-gray-700 transition-colors">
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="block w-full rounded-lg bg-indigo-600 px-3 py-2.5 text-center text-base/7 font-semibold text-white hover:bg-indigo-500 transition-colors">
                    Log in
                  </Link>
                </>
              )}
            </div>

          </div>
        </div>
      )}
    </header>
  )
}

function App() {
  const [user, setUser] = useState(null)

  // Mengambil status login dan (baru) mengambil koin user dari server
  useEffect(() => {
    const checkLoginStatus = async () => {
      const token = localStorage.getItem('token')
      const username = localStorage.getItem('username')
      const is_admin = localStorage.getItem('is_admin') === 'true'
      
      if (token && username) {
        setUser({ username, is_admin }) // Set awal agar UI cepat merespon
        
        // Panggil API untuk mendapatkan saldo koin terbaru
        try {
          const res = await fetch(`${API_BASE_URL}/user/balance`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          if (res.ok) {
            const data = await res.json()
            // Perbarui user state dengan tambahan balance
            setUser(prev => ({ ...prev, balance: data.points }))
          } else {
             // Jika token expired/invalid
             // eslint-disable-next-line react-hooks/immutability
             handleLogout()
          }
        // eslint-disable-next-line no-unused-vars
        } catch (e) {
          console.error("Gagal sinkronisasi koin")
        }
      }
    }
    
    checkLoginStatus()
  }, []) // Akan jalan sekali saat web pertama dibuka

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    localStorage.removeItem('is_admin')
    setUser(null)
  }

  // Fungsi tambahan agar komponen lain (seperti halaman portofolio/login) bisa memperbarui koin navbar
  const updateUserBalance = (newBalance) => {
      setUser(prev => prev ? { ...prev, balance: newBalance } : prev)
  }

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <HelmetProvider>
        <Helmet>
          <link rel="icon" type="image/png" href={logoImage} />
        </Helmet>
        <Router>
          <div className="min-h-screen bg-gray-900 font-sans text-gray-200 selection:bg-indigo-500/30">
            <Navigation user={user} handleLogout={handleLogout} />
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/predict" element={<PredictPage />} />
              <Route path="/fixtures" element={<FixturePage user={user} />} />
              <Route path="/blog" element={<BlogPage user={user} />} />
              <Route path="/performance" element={<PerformancePage />} />
              <Route path="/blog/:id" element={<ArticleDetailPage />} />
              
              <Route path="/leaderboard" element={<LeaderboardPage />} />
              
              {/* Kita lempar updateUserBalance agar saat user pasang koin, koin di navbar otomatis berkurang */}
              <Route 
                path="/tracker" 
                element={user ? <TrackerPage user={user} updateUserBalance={updateUserBalance} /> : <Navigate to="/login" replace />} 
              />
              
              <Route 
                path="/admin" 
                element={user?.is_admin ? <AdminPage /> : <Navigate to="/" replace />} 
              />
              
              {/* Kita lempar update fungsi untuk dipakai saat login selesai */}
              <Route path="/login" element={<LoginPage setUser={setUser} />} />
              <Route path="/register" element={<RegisterPage setUser={setUser} />} />
            </Routes>
          </div>
        </Router>
      </HelmetProvider>
    </GoogleOAuthProvider>
  )
}

export default App