import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { useNavigate } from 'react-router-dom'

export default function FixturePage({ user }) {
  const navigate = useNavigate()
  const [fixtures, setFixtures] = useState([])
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  
  // STATE BARU: Untuk menyimpan input pencarian dari pengguna
  const [searchTerm, setSearchTerm] = useState('')

  // KAMUS NAMA LIGA
  const leagueMap = {
    'E0': 'Premier League', 'I1': 'Serie A', 'D1': 'Bundesliga', 'SP1': 'La Liga', 'F1': 'Ligue 1',
    'N1': 'Eredivisie', 'B1': 'Pro League', 'P1': 'Liga Portugal Betclic', 'SC0': 'Scottish Premiership', 'T1': 'Trendyol Süper Lig', 'G1': 'Stoiximan Super League'
  }

  const fetchFixtures = () => {
    setLoading(true)
    fetch('http://127.0.0.1:8000/api/fixtures')
      .then(res => res.json())
      .then(data => {
        setFixtures(data)
        setLoading(false)
      })
      .catch(err => {
        console.error("Gagal memuat jadwal:", err)
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchFixtures()
  }, [])

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!file) return
    setUploading(true)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('http://127.0.0.1:8000/api/admin/fixtures/upload', {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      if (res.ok) {
        alert(data.message)
        setFile(null)
        fetchFixtures() 
      } else {
        alert("Gagal mengunggah jadwal.")
      }
    // eslint-disable-next-line no-unused-vars
    } catch (err) {
      alert("Gagal menghubungi server.")
    } finally {
      setUploading(false)
    }
  }

  const handleRowClick = (fixture) => {
    navigate('/predict', { state: { fixtureData: fixture } })
  }

  // LOGIKA PENCARIAN (FILTERING)
  // Menyaring array fixtures berdasarkan searchTerm (huruf kecil semua agar tidak case-sensitive)
  const filteredFixtures = fixtures.filter((f) => {
    const searchLower = searchTerm.toLowerCase()
    const homeTeamLower = f.home_team.toLowerCase()
    const awayTeamLower = f.away_team.toLowerCase()
    const realLeagueName = (leagueMap[f.league_name] || f.league_name).toLowerCase()
    
    return (
      homeTeamLower.includes(searchLower) || 
      awayTeamLower.includes(searchLower) || 
      realLeagueName.includes(searchLower)
    )
  })

  return (
    <main className="py-6 md:py-10 px-3 md:px-4 max-w-6xl mx-auto font-sans">
      <Helmet>
        <title>Jadwal Laga | L1PREDIKSIKAN</title>
        <meta name="description" content="Pantau jadwal pertandingan sepak bola Eropa yang belum terlewat, lengkap dengan konversi otomatis ke Waktu Indonesia Barat (WIB)." />
      </Helmet>

      {user?.is_admin && (
        <section aria-labelledby="admin-upload-heading" className="bg-gray-800 shadow-2xl rounded-xl md:rounded-2xl p-5 md:p-8 border border-gray-700 mb-8 md:mb-10 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 md:w-2 h-full bg-gradient-to-b from-blue-500 to-indigo-600"></div>
          
          <h2 id="admin-upload-heading" className="text-xl md:text-2xl font-black text-white mb-1 md:mb-2 uppercase tracking-wider">Mode Admin: Unggah Jadwal</h2>
          <p className="text-xs md:text-sm text-gray-400 mb-5 md:mb-6">Unggah file <code className="bg-gray-900 border border-gray-700 px-1 md:px-2 py-0.5 md:py-1 rounded text-blue-300 font-mono text-[10px] md:text-xs">fixtures.csv</code>. Sistem otomatis memfilter liga & konversi waktu ke WIB.</p>
          
          <form onSubmit={handleUpload} className="flex flex-col md:flex-row items-stretch md:items-center gap-4 md:gap-6">
            <div className="relative flex-1 border-2 border-dashed border-gray-600 bg-gray-900/50 hover:border-blue-500 hover:bg-gray-900 rounded-lg md:rounded-xl p-3 md:p-4 text-center transition-all group overflow-hidden">
              <input 
                type="file" accept=".csv"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                onChange={(e) => setFile(e.target.files[0])}
                required
              />
              <div className="relative z-0 flex flex-col items-center justify-center pointer-events-none">
                <span className={`text-xs md:text-sm font-semibold ${file ? 'text-blue-400' : 'text-gray-400 group-hover:text-gray-300'}`}>
                  {file ? `✅ ${file.name}` : '📁 Klik/geser file .csv ke sini'}
                </span>
              </div>
            </div>
            
            <button 
              type="submit" 
              className="w-full md:w-auto md:min-w-[220px] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3 md:py-4 px-6 md:px-8 rounded-lg md:rounded-xl transition-all shadow-lg text-xs md:text-sm disabled:opacity-50 uppercase tracking-wide"
              disabled={uploading || !file}
            >
              {uploading ? 'MEMPROSES...' : 'SINKRONISASI JADWAL'}
            </button>
          </form>
        </section>
      )}

      <section aria-labelledby="fixtures-heading" className="bg-gray-800 shadow-2xl rounded-xl md:rounded-2xl border border-gray-700 overflow-hidden">
        <div className="bg-gray-950 border-b border-gray-700 p-4 md:p-6 flex flex-col justify-between items-start gap-4">
            
            <div className="flex flex-col sm:flex-row justify-between w-full items-start sm:items-center gap-4">
                <div>
                    <h1 id="fixtures-heading" className="text-lg md:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500 uppercase tracking-wider">
                        Jadwal Pertandingan Mendatang
                    </h1>
                    <p className="text-gray-400 text-xs md:text-sm mt-1">Klik pada pertandingan untuk memprediksi secara otomatis.</p>
                </div>
                
                <div className="flex items-center gap-2 md:gap-3 bg-gray-900 border border-gray-700 px-3 md:px-4 py-1.5 md:py-2.5 rounded-lg shadow-inner self-start sm:self-auto whitespace-nowrap">
                    <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]"></div>
                    <span className="text-[10px] md:text-xs font-bold text-gray-300 uppercase tracking-widest">
                        Waktu <span className="text-green-400">WIB</span>
                    </span>
                </div>
            </div>

            {/* SEKSI PENCARIAN (SEARCH BAR) */}
            <div className="w-full relative mt-2">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-4 h-4 md:w-5 md:h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                </div>
                <input 
                    type="text" 
                    placeholder="Cari nama tim atau liga... (e.g., Madrid, Premier League)" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-600 rounded-lg py-2 md:py-3 pl-10 pr-4 text-xs md:text-sm text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-gray-500"
                />
                {/* Tombol Clear (X) jika ada input pencarian */}
                {searchTerm && (
                    <button 
                        onClick={() => setSearchTerm('')}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-300 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                )}
            </div>
            
        </div>

        {loading ? (
           <div className="text-center py-16 md:py-24" aria-live="polite">
             <div className="inline-block w-6 h-6 md:w-8 md:h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3 md:mb-4"></div>
             <div className="text-gray-500 font-semibold tracking-widest uppercase text-xs md:text-sm">Memuat Jadwal...</div>
           </div>
        ) : filteredFixtures.length > 0 ? (
          <div className="overflow-x-auto max-h-[500px] md:max-h-[700px] relative scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-900">
            <table className="w-full text-xs md:text-sm text-gray-300 min-w-max">
              <thead className="text-[10px] md:text-[11px] text-gray-500 uppercase bg-gray-900/90 border-b border-gray-700 sticky top-0 z-10 backdrop-blur-md">
                <tr>
                  <th className="px-3 md:px-6 py-3 md:py-4 font-bold tracking-widest text-left w-24 md:w-32">Waktu WIB</th>
                  <th className="px-2 md:px-4 py-3 md:py-4 font-bold tracking-widest text-right">Tim Kandang</th>
                  <th className="px-1 md:px-2 py-3 md:py-4 font-bold tracking-widest text-center w-10 md:w-12"></th>
                  <th className="px-2 md:px-4 py-3 md:py-4 font-bold tracking-widest text-left">Tim Tandang</th>
                  <th className="px-3 md:px-6 py-3 md:py-4 font-bold tracking-widest text-center">Liga</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {/* LOOP MENGGUNAKAN DATA YANG SUDAH DIFILTER */}
                {filteredFixtures.map((f) => (
                  <tr 
                    key={f.id} 
                    onClick={() => handleRowClick(f)}
                    title="Klik untuk memprediksi pertandingan ini"
                    className="bg-gray-800/40 hover:bg-gray-700 transition-colors duration-200 group cursor-pointer"
                  >
                    <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-left border-r border-gray-700/30">
                        <div className="flex flex-col">
                            <span className="text-[9px] md:text-[11px] text-blue-400 font-medium mb-0.5 tracking-wider">{f.date}</span>
                            <span className="text-sm md:text-base text-white font-bold">{f.time}</span>
                        </div>
                    </td>
                    
                    <td className="px-2 md:px-4 py-3 md:py-4 text-right">
                        <span className="font-bold text-xs md:text-base text-gray-200 group-hover:text-blue-400 transition-colors">{f.home_team}</span>
                    </td>
                    
                    <td className="px-1 md:px-2 py-3 md:py-4 text-center">
                        <span className="bg-gray-900 border border-gray-700 text-gray-500 text-[8px] md:text-[10px] px-1.5 md:px-2 py-0.5 md:py-1 rounded font-black tracking-widest shadow-sm">VS</span>
                    </td>
                    
                    <td className="px-2 md:px-4 py-3 md:py-4 text-left border-l border-gray-700/30">
                        <span className="font-bold text-xs md:text-base text-gray-200 group-hover:text-blue-400 transition-colors">{f.away_team}</span>
                    </td>

                    <td className="px-3 md:px-6 py-3 md:py-4 text-center whitespace-nowrap">
                        <span className="bg-gray-700/50 text-blue-300 border border-blue-500/30 px-2 md:px-3 py-1 md:py-1.5 rounded text-[10px] md:text-xs font-bold tracking-widest shadow-sm inline-block">
                            {leagueMap[f.league_name] || f.league_name}
                        </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 md:py-24 bg-gray-900/30 px-4 flex flex-col items-center justify-center">
            {/* Tampilan khusus jika hasil pencarian tidak ditemukan */}
            {searchTerm && fixtures.length > 0 ? (
                <>
                    <svg className="w-12 h-12 text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <p className="text-gray-400 font-medium text-sm md:text-lg">Tidak menemukan hasil untuk "<span className="text-white">{searchTerm}</span>".</p>
                    <button onClick={() => setSearchTerm('')} className="mt-3 text-blue-400 hover:text-blue-300 text-xs md:text-sm font-bold tracking-widest uppercase underline">Reset Pencarian</button>
                </>
            ) : (
                <>
                    <p className="text-gray-400 font-medium text-sm md:text-lg">Tidak ada jadwal pertandingan mendatang.</p>
                    {user?.is_admin && <p className="text-gray-600 text-xs md:text-sm mt-2">Silakan unggah file jadwal terbaru di panel Admin atas.</p>}
                </>
            )}
          </div>
        )}
      </section>

    </main>
  )
}