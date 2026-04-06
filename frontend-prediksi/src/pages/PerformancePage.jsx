import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'

export default function PerformancePage() {
  const [leagues, setLeagues] = useState([])
  const [selectedLeague, setSelectedLeague] = useState('')
  const [stats, setStats] = useState([])
  const [loading, setLoading] = useState(false)

  // KAMUS NAMA LIGA
  const leagueMap = {
    'E0': 'Premier League', 'I1': 'Serie A', 'D1': 'Bundesliga', 'SP1': 'La Liga', 'F1': 'Ligue 1',
    'N1': 'Eredivisie', 'B1': 'Pro League', 'P1': 'Liga Portugal Betclic', 'SC0': 'Scottish Premiership', 'T1': 'Trendyol Süper Lig', 'G1': 'Stoiximan Super League'
  }

  // Tambahkan setLeagues ke dalam array dependensi agar linter tenang
  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/leagues')
      .then(res => res.json())
      .then(data => setLeagues(data))
      .catch(() => console.error("Gagal memuat liga dari server."));
  }, [setLeagues])

  // Tambahkan setLoading dan setStats ke dalam array dependensi
  useEffect(() => {
    if (selectedLeague) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(true); // Menambahkan titik koma di sini
      fetch(`http://127.0.0.1:8000/api/performance/${selectedLeague}`)
        .then(res => res.json())
        .then(data => {
          setStats(data);
          setLoading(false);
        })
        .catch(() => {
            console.error("Gagal memuat data performa dari server.");
            setLoading(false);
        });
    } else {
        setStats([]);
    }
  }, [selectedLeague])

  const getAccuracyColor = (val) => {
    if (val >= 65) return 'text-green-400';
    if (val >= 50) return 'text-yellow-400';
    return 'text-red-400';
  }

  return (
    <main className="py-6 md:py-10 px-3 md:px-4 max-w-6xl mx-auto font-sans">
      <Helmet>
        <title>Laporan Performa AI | L1PREDIKSIKAN</title>
        <meta name="description" content="Lihat transparansi tingkat akurasi historis model L1PREDIKSIKAN dalam memprediksi HDA, Over/Under, dan BTTS setiap musimnya." />
      </Helmet>

      <section aria-labelledby="performance-heading" className="bg-gray-800 shadow-2xl rounded-xl md:rounded-2xl p-5 md:p-8 border border-gray-700">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 md:mb-8 gap-4 border-b border-gray-700 pb-4 md:pb-6">
          <div>
            <h1 id="performance-heading" className="text-xl md:text-2xl font-bold text-white uppercase tracking-wider">Laporan Performa AI</h1>
            <p className="text-gray-400 text-xs md:text-sm mt-1">Analisis akurasi model berdasarkan hasil pertandingan asli</p>
          </div>
          
          <select 
            className="bg-gray-900 border border-gray-600 rounded-lg p-2.5 md:p-3 text-sm md:text-base text-white focus:ring-2 focus:ring-blue-500 outline-none w-full sm:w-48 md:w-64 transition"
            value={selectedLeague}
            onChange={(e) => setSelectedLeague(e.target.value)}
            aria-label="Pilih Liga"
          >
            <option value="">-- Pilih Liga --</option>
            {/* PENERJEMAHAN KODE LIGA KE NAMA ASLI */}
            {leagues.map(l => <option key={l.name} value={l.name}>{leagueMap[l.name] || l.name}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="text-center py-16 md:py-20" aria-live="polite">
            <div className="text-gray-500 animate-pulse font-semibold tracking-widest uppercase text-xs md:text-sm">Mengkalkulasi Akurasi Historis...</div>
          </div>
        ) : stats.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:gap-8">
            {stats.map((s, idx) => (
              <article key={idx} className="bg-gray-900 rounded-xl p-4 md:p-6 border border-gray-700 hover:border-gray-600 transition-all shadow-inner">
                <div className="flex justify-between items-center mb-4 md:mb-6 border-b border-gray-800 pb-3 md:pb-4">
                  <h2 className="text-lg md:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">
                    MUSIM {s.season}
                  </h2>
                  <span className="bg-gray-800 border border-gray-700 px-3 md:px-4 py-1 rounded-full text-[10px] md:text-xs font-bold text-gray-400 shadow-sm">
                    {s.total_matches} Pertandingan
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
                  <div className="text-center p-4 md:p-5 bg-gray-800/80 rounded-xl border border-gray-700/50 hover:bg-gray-800 transition">
                    <p className="text-[10px] md:text-xs text-gray-500 uppercase font-bold mb-2 md:mb-3 tracking-widest">Akurasi HDA (DNB)</p>
                    <p className={`text-3xl md:text-4xl font-black ${getAccuracyColor(s.hda_accuracy)}`}>{s.hda_accuracy}%</p>
                    <div className="w-full bg-gray-700 h-1.5 md:h-2 mt-3 md:mt-5 rounded-full overflow-hidden shadow-inner">
                        <div className="bg-blue-500 h-full transition-all duration-1000" style={{width: `${s.hda_accuracy}%`}}></div>
                    </div>
                  </div>

                  <div className="text-center p-4 md:p-5 bg-gray-800/80 rounded-xl border border-gray-700/50 hover:bg-gray-800 transition">
                    <p className="text-[10px] md:text-xs text-gray-500 uppercase font-bold mb-2 md:mb-3 tracking-widest">Akurasi Over/Under 2.5</p>
                    <p className={`text-3xl md:text-4xl font-black ${getAccuracyColor(s.ou_accuracy)}`}>{s.ou_accuracy}%</p>
                    <div className="w-full bg-gray-700 h-1.5 md:h-2 mt-3 md:mt-5 rounded-full overflow-hidden shadow-inner">
                        <div className="bg-green-500 h-full transition-all duration-1000" style={{width: `${s.ou_accuracy}%`}}></div>
                    </div>
                  </div>

                  <div className="text-center p-4 md:p-5 bg-gray-800/80 rounded-xl border border-gray-700/50 hover:bg-gray-800 transition">
                    <p className="text-[10px] md:text-xs text-gray-500 uppercase font-bold mb-2 md:mb-3 tracking-widest">Akurasi BTTS (Yes/No)</p>
                    <p className={`text-3xl md:text-4xl font-black ${getAccuracyColor(s.btts_accuracy)}`}>{s.btts_accuracy}%</p>
                    <div className="w-full bg-gray-700 h-1.5 md:h-2 mt-3 md:mt-5 rounded-full overflow-hidden shadow-inner">
                        <div className="bg-purple-500 h-full transition-all duration-1000" style={{width: `${s.btts_accuracy}%`}}></div>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 md:py-20 bg-gray-900 rounded-xl border border-gray-800 px-4">
            <p className="text-gray-500 font-medium text-sm md:text-base">Silakan pilih liga di atas untuk melihat riwayat performa model AI.</p>
          </div>
        )}
      </section>
    </main>
  )
}