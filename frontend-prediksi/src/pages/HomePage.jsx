import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://l1prediksikan.my.id/api'

export default function HomePage() {
  const navigate = useNavigate()
  const [fixtures, setFixtures] = useState([])
  const [topPerformances, setTopPerformances] = useState([])
  const [articles, setArticles] = useState([])
  const [topLeaders, setTopLeaders] = useState([]) 
  
  // STATE DIPISAH: loading utama dan loading khusus performa
  const [loading, setLoading] = useState(true)
  const [perfLoading, setPerfLoading] = useState(true)
  
  const [openFaq, setOpenFaq] = useState(0)

  const leagueMap = {
    'E0': 'Premier League',
    'I1': 'Serie A',
    'D1': 'Bundesliga',
    'SP1': 'La Liga',
    'F1': 'Ligue 1'
  }

  useEffect(() => {
    // 1. FUNGSI UNTUK DATA RINGAN (Langsung Tampil)
    const fetchMainData = async () => {
      try {
        const fixRes = await fetch(`${API_BASE_URL}/fixtures`)
        if (fixRes.ok) {
            const fixData = await fixRes.json()
            const topLeagues = ['E0', 'I1', 'D1', 'SP1', 'F1']
            if (Array.isArray(fixData)) {
                setFixtures(fixData.filter(f => topLeagues.includes(f.league_name)).slice(0, 5))
            }
        }

        const artRes = await fetch(`${API_BASE_URL}/articles`)
        if (artRes.ok) {
            const artData = await artRes.json()
            if (Array.isArray(artData)) setArticles(artData.slice(0, 3))
        }

        const leadRes = await fetch(`${API_BASE_URL}/leaderboard`)
        if (leadRes.ok) {
            const leadData = await leadRes.json()
            if (Array.isArray(leadData)) setTopLeaders(leadData.slice(0, 5))
        }
      } catch (error) {
        console.error("Gagal memuat data utama:", error)
      } finally {
        setLoading(false) // Mematikan loading layar penuh dengan cepat!
      }
    }

    // 2. FUNGSI UNTUK DATA BERAT (Berjalan di background)
    const fetchPerformanceData = async () => {
        try {
            const topLeagues = ['E0', 'I1', 'D1', 'SP1', 'F1']
            const perfPromises = topLeagues.map(l => 
              fetch(`${API_BASE_URL}/performance/${l}`)
                .then(res => res.ok ? res.json() : [])
                .then(data => Array.isArray(data) ? data.map(d => ({...d, league: l})) : [])
                .catch(() => []) // Mencegah crash jika satu liga gagal dimuat
            )
            
            const perfResults = await Promise.all(perfPromises)
            const allPerformances = perfResults.flat()
            
            if (allPerformances.length > 0) {
                const allSeasons = [...new Set(allPerformances.map(p => p.season))]
                const latestSeason = allSeasons.sort().reverse()[0]
                const latestPerformances = allPerformances.filter(p => p.season === latestSeason)
                const sortedPerf = latestPerformances.sort((a, b) => {
                    const avgA = (a.hda_accuracy + a.ou_accuracy + a.btts_accuracy) / 3
                    const avgB = (b.hda_accuracy + b.ou_accuracy + b.btts_accuracy) / 3
                    return avgB - avgA
                })
                setTopPerformances(sortedPerf.slice(0, 3))
            }
        } catch (error) {
            console.error("Gagal kalkulasi performa:", error)
        } finally {
            setPerfLoading(false) // Mematikan loading di seksi performa saja
        }
    }

    // Jalankan pemuatan bertahap
    fetchMainData().then(() => fetchPerformanceData())
  }, [])

  const handleRowClick = (fixture) => {
    navigate('/predict', { state: { fixtureData: fixture } })
  }

  // Komponen Helper untuk Accordion
  const FaqItem = ({ index, title, icon, colorClass, children }) => {
    const isOpen = openFaq === index;
    return (
      <div className="bg-gray-800/80 border border-gray-700/80 rounded-lg overflow-hidden transition-all duration-300 mb-3 shadow-sm">
        <button 
          onClick={() => setOpenFaq(isOpen ? null : index)}
          className="w-full flex items-center justify-between p-4 md:p-5 text-left focus:outline-none hover:bg-gray-700/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className={colorClass}>{icon}</span>
            <span className={`font-bold text-sm md:text-base transition-colors ${isOpen ? colorClass : 'text-gray-200'}`}>
              {title}
            </span>
          </div>
          <svg 
            className={`w-5 h-5 transition-transform duration-300 ${isOpen ? 'rotate-180 ' + colorClass : 'text-gray-500'}`} 
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>
        <div 
          className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
        >
          <div className="p-4 md:p-5 pt-0 text-gray-300 text-xs md:text-sm leading-relaxed border-t border-gray-700/50 mt-1">
            {children}
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="font-sans text-gray-200">
      <Helmet>
        <title>Beranda | L1PREDIKSI-KAN - Analitik Sepak Bola Berbasis AI</title>
        <meta name="description" content="Sistem Machine Learning cerdas untuk memprediksi pertandingan sepak bola elit Eropa berdasarkan data statistik dan probabilitas matematika." />
      </Helmet>
      
      <header className="relative bg-gray-900 overflow-hidden border-b border-gray-800">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-gray-900 to-black z-0"></div>
        
        <div className="relative z-10 max-w-6xl mx-auto px-4 py-16 md:py-24 lg:py-32 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[10px] md:text-xs font-bold tracking-widest uppercase mb-4 md:mb-6 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
            <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-blue-400 animate-pulse"></span>
            Sistem Analitik Sepak Bola
          </div>
          
          <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-black text-white mb-4 md:mb-6 tracking-tight leading-tight">
            Kalahkan Bandar dengan <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">
              Kecerdasan Buatan
            </span>
          </h1>
          
          <p className="text-sm sm:text-base md:text-xl text-gray-400 max-w-3xl mb-8 md:mb-10 leading-relaxed px-2">
            L1Prediksi-Kan menganalisis ribuan data historis, Elo Rating dinamis, dan tren performa terkini menggunakan algoritma Machine Learning untuk memberikan prediksi laga sepak bola paling akurat.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 w-full sm:w-auto justify-center px-4">
            <Link to="/fixtures" title="Lihat Jadwal Pertandingan" className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3 md:py-4 px-6 md:px-10 rounded-xl transition-all duration-300 shadow-lg shadow-blue-900/30 text-sm md:text-lg uppercase tracking-wide text-center">
              Lihat Jadwal Laga
            </Link>
            <Link to="/performance" title="Cek Akurasi Model AI" className="w-full sm:w-auto bg-gray-800 hover:bg-gray-700 border border-gray-600 text-white font-bold py-3 md:py-4 px-6 md:px-10 rounded-xl transition-all duration-300 shadow-lg text-sm md:text-lg uppercase tracking-wide text-center">
              Cek Akurasi Model
            </Link>
          </div>
        </div>
      </header>

      {loading ? (
        <div className="py-20 md:py-32 text-center" aria-live="polite">
          <div className="inline-block w-6 h-6 md:w-8 md:h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3 md:mb-4"></div>
          <div className="text-gray-500 font-semibold tracking-widest uppercase text-xs md:text-sm">Mempersiapkan Dashboard...</div>
        </div>
      ) : (
        <div className="max-w-6xl mx-auto px-4 py-10 md:py-16 space-y-16 md:space-y-24">

          {/* ================= JADWAL LAGA TERDEKAT ================= */}
          <section aria-labelledby="fixtures-heading">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 md:mb-8 border-b border-gray-800 pb-3 md:pb-4 gap-2">
              <div>
                <h2 id="fixtures-heading" className="text-xl sm:text-2xl md:text-3xl font-black text-white uppercase tracking-wider">Laga Top Eropa Terdekat</h2>
                <p className="text-gray-400 text-xs md:text-sm mt-1">Klik pada pertandingan untuk memprediksi secara otomatis.</p>
              </div>
              <Link to="/fixtures" title="Semua Jadwal Laga" className="hidden sm:flex text-blue-400 hover:text-blue-300 font-bold text-xs md:text-sm uppercase tracking-wider items-center transition-colors">
                Lihat Semua Jadwal <svg className="w-3 h-3 md:w-4 md:h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </Link>
            </div>

            {fixtures.length > 0 ? (
              <div className="bg-gray-800 rounded-xl md:rounded-2xl border border-gray-700 overflow-x-auto shadow-xl md:shadow-2xl">
                <table className="w-full text-xs md:text-sm text-gray-300 min-w-[500px]">
                  <tbody className="divide-y divide-gray-700/50">
                    {fixtures.map((f) => (
                      <tr 
                        key={f.id} 
                        onClick={() => handleRowClick(f)}
                        title="Klik untuk memprediksi pertandingan ini"
                        className="hover:bg-gray-700 transition-colors duration-200 group cursor-pointer"
                      >
                        <td className="px-3 md:px-6 py-3 md:py-5 w-24 md:w-32 border-r border-gray-700/30">
                          <div className="text-[10px] md:text-xs text-blue-400 font-semibold mb-0.5 md:mb-1">{f.date}</div>
                          <div className="text-base md:text-lg text-white font-black">{f.time} <span className="text-[10px] md:text-xs text-gray-500 font-normal">WIB</span></div>
                        </td>
                        <td className="px-3 md:px-6 py-3 md:py-5 text-right w-1/3">
                          <span className="font-bold text-sm md:text-lg text-gray-100 group-hover:text-blue-400 transition-colors">{f.home_team}</span>
                        </td>
                        <td className="px-2 md:px-4 py-3 md:py-5 text-center">
                          <div className="flex flex-col items-center justify-center gap-1 md:gap-1.5">
                            <span className="bg-gray-900 border border-gray-700 text-gray-500 text-[8px] md:text-[10px] px-1.5 md:px-2 py-0.5 rounded font-black tracking-widest">VS</span>
                            <span className="text-[8px] md:text-[10px] text-gray-400 font-bold tracking-widest text-center whitespace-nowrap">{leagueMap[f.league_name] || f.league_name}</span>
                          </div>
                        </td>
                        <td className="px-3 md:px-6 py-3 md:py-5 text-left w-1/3 border-l border-gray-700/30">
                          <span className="font-bold text-sm md:text-lg text-gray-100 group-hover:text-blue-400 transition-colors">{f.away_team}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-gray-800/50 border border-gray-700 rounded-xl md:rounded-2xl p-6 md:p-10 text-center">
                <p className="text-gray-400 text-xs md:text-sm italic">Belum ada jadwal pertandingan dalam waktu dekat untuk 5 Liga Top Eropa.</p>
              </div>
            )}
          </section>

          {/* ================= TOP PERFORMA MODEL ================= */}
          <section aria-labelledby="performance-heading">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 md:mb-8 border-b border-gray-800 pb-3 md:pb-4 gap-2">
              <div>
                <h2 id="performance-heading" className="text-xl sm:text-2xl md:text-3xl font-black text-white uppercase tracking-wider">Rekor Performa AI</h2>
                <p className="text-gray-400 text-xs md:text-sm mt-1">Tingkat akurasi tertinggi model pada musim kompetisi terbaru.</p>
              </div>
              <Link to="/performance" title="Laporan Lengkap Performa AI" className="hidden sm:flex text-orange-400 hover:text-orange-300 font-bold text-xs md:text-sm uppercase tracking-wider items-center transition-colors">
                Laporan Lengkap <svg className="w-3 h-3 md:w-4 md:h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </Link>
            </div>

            {perfLoading ? (
              <div className="bg-gray-800/20 border border-gray-700/50 rounded-xl p-10 text-center animate-pulse">
                 <div className="inline-block w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                 <p className="text-gray-500 text-xs uppercase tracking-widest font-bold">Mengkalkulasi Performa AI Terbaru...</p>
              </div>
            ) : topPerformances.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                {topPerformances.map((p, idx) => (
                  <Link to="/performance" title={`Lihat performa ${leagueMap[p.league] || p.league}`} key={idx} className="bg-gray-800 rounded-xl md:rounded-2xl p-4 md:p-6 border border-gray-700 hover:border-orange-500/50 hover:shadow-[0_0_20px_rgba(249,115,22,0.1)] transition-all group block">
                    <div className="flex justify-between items-center mb-3 md:mb-4">
                      <span className="text-xs md:text-sm font-black text-orange-400 uppercase tracking-widest">{leagueMap[p.league] || p.league}</span>
                      <span className="bg-gray-900 border border-gray-700 text-gray-400 text-[10px] md:text-xs px-2 py-0.5 md:py-1 rounded font-bold">{p.season}</span>
                    </div>
                    
                    <div className="space-y-3 md:space-y-4">
                      <div>
                        <div className="flex justify-between text-[10px] md:text-xs font-bold text-gray-500 uppercase mb-1">
                          <span>HDA (DNB)</span>
                          <span className="text-white">{p.hda_accuracy}%</span>
                        </div>
                        <div className="w-full bg-gray-900 h-1 md:h-1.5 rounded-full overflow-hidden"><div className="bg-blue-500 h-full" style={{width: `${p.hda_accuracy}%`}}></div></div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[10px] md:text-xs font-bold text-gray-500 uppercase mb-1">
                          <span>Over/Under</span>
                          <span className="text-white">{p.ou_accuracy}%</span>
                        </div>
                        <div className="w-full bg-gray-900 h-1 md:h-1.5 rounded-full overflow-hidden"><div className="bg-green-500 h-full" style={{width: `${p.ou_accuracy}%`}}></div></div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[10px] md:text-xs font-bold text-gray-500 uppercase mb-1">
                          <span>BTTS</span>
                          <span className="text-white">{p.btts_accuracy}%</span>
                        </div>
                        <div className="w-full bg-gray-900 h-1 md:h-1.5 rounded-full overflow-hidden"><div className="bg-purple-500 h-full" style={{width: `${p.btts_accuracy}%`}}></div></div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-gray-800/50 border border-gray-700 rounded-xl md:rounded-2xl p-6 md:p-10 text-center">
                <p className="text-gray-400 text-xs md:text-sm italic">Belum ada data performa yang dihitung.</p>
              </div>
            )}
          </section>

          {/* ================= LEADERBOARD (DESAIN DAFTAR/LIST) ================= */}
          <section aria-labelledby="leaderboard-heading">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 md:mb-8 border-b border-gray-800 pb-3 md:pb-4 gap-2">
              <div>
                <h2 id="leaderboard-heading" className="text-xl sm:text-2xl md:text-3xl font-black text-white uppercase tracking-wider">Top Prediktor Musim Ini</h2>
                <p className="text-gray-400 text-xs md:text-sm mt-1">Pengguna dengan perolehan Koin Virtual tertinggi.</p>
              </div>
              <Link to="/leaderboard" title="Lihat Papan Peringkat Lengkap" className="hidden sm:flex text-yellow-400 hover:text-yellow-300 font-bold text-xs md:text-sm uppercase tracking-wider items-center transition-colors">
                Peringkat Global <svg className="w-3 h-3 md:w-4 md:h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </Link>
            </div>

            {topLeaders.length > 0 ? (
                <div className="bg-gray-800/40 rounded-2xl border border-gray-700/50 overflow-hidden shadow-lg">
                    <ul className="divide-y divide-gray-700/50">
                        {topLeaders.map((leader, index) => {
                            const isTop3 = index < 3;
                            let medal = '';
                            let rankColor = 'text-gray-500';
                            
                            if (index === 0) { medal = '🥇'; rankColor = 'text-yellow-400'; }
                            else if (index === 1) { medal = '🥈'; rankColor = 'text-gray-300'; }
                            else if (index === 2) { medal = '🥉'; rankColor = 'text-orange-400'; }

                            return (
                                <li key={index} className={`flex items-center justify-between p-4 sm:p-5 hover:bg-gray-700/50 transition-colors ${index === 0 ? 'bg-gray-800/80' : ''}`}>
                                    <div className="flex items-center gap-4 sm:gap-6">
                                        <div className={`w-8 text-center font-black text-lg sm:text-xl ${rankColor}`}>
                                            {isTop3 ? medal : `#${index + 1}`}
                                        </div>
                                        
                                        <div className={`hidden sm:flex w-10 h-10 rounded-full items-center justify-center font-bold text-gray-900 ${index === 0 ? 'bg-yellow-400' : 'bg-gray-400'}`}>
                                            {leader.username.charAt(0).toUpperCase()}
                                        </div>

                                        <div className="flex flex-col">
                                            <span className={`font-bold sm:text-lg truncate max-w-[150px] sm:max-w-[300px] ${index === 0 ? 'text-white' : 'text-gray-200'}`}>
                                                {leader.username}
                                            </span>
                                            <span className="text-yellow-500 font-black text-xs sm:text-sm mt-0.5 flex items-center gap-1">
                                                🪙 {leader.points.toLocaleString()} <span className="text-gray-500 font-normal text-[10px] sm:text-xs">Koin</span>
                                            </span>
                                        </div>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            ) : (
              <div className="bg-gray-800/50 border border-gray-700 rounded-xl md:rounded-2xl p-6 md:p-10 text-center">
                <p className="text-gray-400 text-xs md:text-sm italic">Belum ada pengguna yang masuk ke papan peringkat.</p>
              </div>
            )}
            
            <div className="mt-4 md:hidden text-center">
               <Link to="/leaderboard" className="text-yellow-400 hover:text-yellow-300 font-bold text-xs uppercase tracking-wider inline-flex items-center transition-colors">
                  Peringkat Global <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
               </Link>
            </div>
          </section>

          {/* ================= ARTIKEL TERBARU ================= */}
          <section aria-labelledby="articles-heading">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 md:mb-8 border-b border-gray-800 pb-3 md:pb-4 gap-2">
              <div>
                <h2 id="articles-heading" className="text-xl sm:text-2xl md:text-3xl font-black text-white uppercase tracking-wider">Artikel Terbaru</h2>
                <p className="text-gray-400 text-xs md:text-sm mt-1">Insight teknologi, opini, dan pengembangan sistem.</p>
              </div>
              <Link to="/blog" title="Semua Artikel dan Blog" className="hidden sm:flex text-purple-400 hover:text-purple-300 font-bold text-xs md:text-sm uppercase tracking-wider items-center transition-colors">
                Ke Blog <svg className="w-3 h-3 md:w-4 md:h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </Link>
            </div>

            {articles.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                {articles.map((article) => (
                  <article key={article.id} className="h-full">
                    <Link to={`/blog/${article.id}`} title={`Baca Artikel: ${article.title}`} className="bg-gray-800 rounded-xl md:rounded-2xl border border-gray-700 overflow-hidden hover:border-gray-500 hover:shadow-[0_0_20px_rgba(168,85,247,0.15)] transition-all duration-300 group flex flex-col h-full">
                      <div className="p-4 md:p-6 flex flex-col flex-grow">
                        <span className={`inline-block w-max border px-2 md:px-3 py-0.5 md:py-1 rounded-full text-[8px] md:text-[10px] font-bold tracking-widest uppercase shadow-sm mb-3 md:mb-4 ${article.color}`}>
                          {article.category}
                        </span>
                        <h3 className="text-base md:text-lg font-bold text-gray-100 group-hover:text-purple-400 transition-colors duration-200 mb-2 md:mb-3 leading-snug">
                          {article.title}
                        </h3>
                        <p className="text-xs md:text-sm text-gray-400 line-clamp-3 mb-4 md:mb-6 flex-grow">
                          {article.excerpt}
                        </p>
                        <div className="flex items-center justify-between text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wider mt-auto">
                          <time dateTime={article.created_at}>🗓 {article.created_at}</time>
                          <span className="text-purple-500 group-hover:translate-x-1 transition-transform">Baca &rarr;</span>
                        </div>
                      </div>
                    </Link>
                  </article>
                ))}
              </div>
            ) : (
              <div className="bg-gray-800/50 border border-gray-700 rounded-xl md:rounded-2xl p-6 md:p-10 text-center">
                <p className="text-gray-400 text-xs md:text-sm italic">Belum ada artikel yang diterbitkan.</p>
              </div>
            )}
          </section>

          {/* ================= FAQ / INFORMASI SISTEM ================= */}
          <section className="max-w-4xl mx-auto pt-8 border-t border-gray-800/50">
            <FaqItem 
              index={0} 
              title="Batasan Model (Disclaimer)"  
              colorClass="text-blue-400"
            >
              <p>L1PREDIKSI-KAN dirancang sebagai alat bantu analitik berbasis data statistik historis, bukan alat ramalan pasti. Model AI kami murni mengandalkan metrik seperti performa tim, rekor pertemuan, selisih gol, dan pergerakan odds bursa taruhan.</p>
              <br/>
              <p>Oleh karena itu, model ini tidak dapat memperhitungkan faktor-faktor tak terduga (force majeure) di atas lapangan hijau. Insiden seperti kartu merah cepat, cedera pemain kunci saat pemanasan, keputusan kontroversial VAR, cuaca ekstrem, atau tembakan yang membentur tiang gawang adalah murni dinamika sepak bola yang berada di luar jangkauan komputasi matematika. Kami sangat menyarankan Anda untuk menggunakan persentase prediksi ini hanya sebagai wawasan tambahan (insight) dan referensi pembanding, bukan sebagai jaminan mutlak untuk hasil akhir suatu pertandingan.</p>
            </FaqItem>
            
            <FaqItem 
              index={1} 
              title="Tentang Prediksi-Kan" 
              colorClass="text-blue-400"
            >
              L1Prediksi-Kan adalah sebuah platform analitik cerdas yang didedikasikan untuk para penggemar sepak bola dan penikmat data statistik. Kami membangun sebuah mesin komputasi yang mampu menganalisis ribuan data pertandingan historis secara otomatis untuk menemukan pola tersembunyi yang seringkali terlewatkan oleh analisis manusia biasa.<br/><br/>
              Visi utama platform ini adalah menghadirkan transparansi data dan memberikan pandangan yang lebih objektif dalam memetakan kekuatan dua tim yang akan bertanding. Dengan memadukan metrik performa lanjutan seperti Elo Rating, dinamika formasi, serta tren probabilitas bursa global, L1Prediksi-Kan bertujuan menjadi asisten virtual terbaik Anda dalam membaca arah pertandingan sebelum peluit *kick-off* dibunyikan.
            </FaqItem>
            
            <FaqItem 
              index={2} 
              title="Daftar Liga & Cara Kerja" 
              colorClass="text-blue-400"
            >
              <p>Sistem kami secara aktif memonitor dan menganalisis pertandingan dari 11 kompetisi bergengsi di Eropa, yaitu: <strong>English Premier League, Serie A Italia, Bundesliga Jerman, La Liga Spanyol, Ligue 1 Prancis, Eredivisie Belanda, Pro League Belgia, Liga Portugal Betclic, Scottish Premiership, Trendyol Süper Lig Turki, dan Stoiximan Super League Yunani.</strong></p>
              <br/>
              <p>Untuk melakukan prediksi, Anda cukup masuk ke menu <strong>'Jadwal Laga'</strong>, pilih pertandingan yang ingin dianalisis, lalu sistem akan memproses data tersebut secara <em>real-time</em> di Terminal Prediksi.</p>
              <br/>
              <p>Sebagai fitur interaktif, kami juga menyediakan sistem <strong>'Portofolio Prediksi'</strong>. Setiap pengguna baru yang mendaftar akan mendapatkan modal awal sebesar <strong>1.000 Koin Virtual</strong> secara gratis. Anda dapat menggunakan koin ini untuk 'bertaruh' pada prediksi AI yang Anda yakini. Jika tebakan Anda tepat setelah laga dunia nyata selesai, koin Anda akan bertambah sesuai dengan nilai <em>odds</em> pertandingan tersebut. Anda bisa memantau peringkat Anda melawan pengguna lain di menu 'Peringkat Global'!</p>
            </FaqItem>
          </section>

        </div>
      )}

      <footer className="bg-gray-950 border-t border-gray-800 mt-12 md:mt-20">
        <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 md:gap-8">
            <div className="text-center md:text-left">
              <div className="text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500 tracking-wider uppercase mb-2">
                L1Prediksi-Kan
              </div>
              <p className="text-xs md:text-sm text-gray-500 max-w-sm mx-auto md:mx-0">
                Sistem Machine Learning cerdas untuk memprediksi pertandingan sepak bola elit Eropa berdasarkan data statistik dan probabilitas matematika.
              </p>
            </div>
            <nav aria-label="Footer Navigation" className="flex flex-wrap justify-center gap-4 md:gap-6 text-[10px] md:text-sm font-bold text-gray-500 uppercase tracking-widest">
              <Link to="/predict" className="hover:text-blue-400 transition-colors py-1">Prediksi</Link>
              <Link to="/fixtures" className="hover:text-green-400 transition-colors py-1">Jadwal</Link>
              <Link to="/performance" className="hover:text-orange-400 transition-colors py-1">Akurasi</Link>
              <Link to="/blog" className="hover:text-purple-400 transition-colors py-1">Blog</Link>
            </nav>
          </div>
          <div className="border-t border-gray-800 mt-6 pt-6 md:mt-8 md:pt-8 flex flex-col md:flex-row justify-between items-center text-[10px] md:text-xs text-gray-600 font-medium">
            <p>&copy; {new Date().getFullYear()} L1PREDIKSI-KAN Analytics. All rights reserved.</p>
            <p className="mt-2 md:mt-0 text-center">Dirancang untuk riset & analisis data.</p>
          </div>
        </div>
      </footer>
    </main>
  )
}