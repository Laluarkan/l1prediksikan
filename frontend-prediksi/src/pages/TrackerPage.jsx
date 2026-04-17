import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { Navigate } from 'react-router-dom'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://l1prediksikan.my.id/api'

export default function TrackerPage({ user }) {
  const [bets, setBets] = useState([])
  const [balance, setBalance] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const fetchTrackerData = async () => {
      try {
        const token = localStorage.getItem('token')
        const headers = { 'Authorization': `Bearer ${token}` }
        
        const balRes = await fetch(`${API_BASE_URL}/user/balance`, { headers })
        if (balRes.ok) {
            const balData = await balRes.json()
            setBalance(balData.points)
        }

        const betRes = await fetch(`${API_BASE_URL}/bets/history`, { headers })
        if (betRes.ok) {
            const betData = await betRes.json()
            setBets(betData)
        }
      } catch (err) {
        console.error("Gagal memuat portofolio", err)
      } finally {
        setLoading(false)
      }
    }
    fetchTrackerData()
  }, [user])

  if (!user) return <Navigate to="/login" replace />

  return (
    <main className="py-6 md:py-10 px-3 md:px-4 max-w-5xl mx-auto font-sans">
      <Helmet>
        <title>Portofolio Prediksi | L1PREDIKSIKAN</title>
      </Helmet>

      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 md:p-10 text-white shadow-xl mb-8 flex flex-col md:flex-row items-center justify-between">
        <div>
            <h1 className="text-2xl md:text-4xl font-black uppercase tracking-wider mb-2">Portofolio Anda</h1>
            <p className="text-blue-200 text-sm">Lacak rekam jejak tebakan Anda dan kumpulkan poin.</p>
        </div>
        <div className="mt-6 md:mt-0 bg-black/30 px-6 py-4 rounded-xl border border-white/20 text-center">
            <span className="block text-xs font-bold text-blue-200 uppercase tracking-widest mb-1">Total Koin</span>
            <span className="text-4xl font-black text-yellow-400">🪙 {balance.toLocaleString()}</span>
        </div>
      </div>

      <section className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden shadow-2xl">
        <div className="bg-gray-950 border-b border-gray-700 p-4 md:p-6">
            <h2 className="text-lg font-bold text-white uppercase tracking-wider">Riwayat Taruhan (Virtual)</h2>
        </div>

        {loading ? (
            <div className="text-center py-20 text-gray-500 animate-pulse">Memuat data...</div>
        ) : bets.length > 0 ? (
            <div className="overflow-x-auto max-h-[600px] scrollbar-thin">
                <table className="w-full text-xs md:text-sm text-gray-300 min-w-[700px]">
                    <thead className="text-[10px] text-gray-500 uppercase bg-gray-900 sticky top-0 z-10">
                        <tr>
                            <th className="px-4 py-4 text-left">Waktu Pasang</th>
                            <th className="px-4 py-4 text-center">Pertandingan</th>
                            <th className="px-4 py-4 text-center">Kategori</th>
                            <th className="px-4 py-4 text-center">Pilihan</th>
                            <th className="px-4 py-4 text-center">Odds</th>
                            <th className="px-4 py-4 text-center">Koin</th>
                            <th className="px-4 py-4 text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700/50">
                        {bets.map(b => (
                            <tr key={b.id} className="hover:bg-gray-700/50 transition-colors">
                                <td className="px-4 py-5 text-gray-400 align-middle whitespace-nowrap">{b.created_at}</td>
                                <td className="px-4 py-5 align-middle">
                                    <div className="flex items-center justify-center gap-2 md:gap-4 min-w-[280px]">
                                        
                                        <div className="flex items-center justify-end gap-2 md:gap-3 flex-1">
                                            {b.home_logo ? (
                                                <img src={b.home_logo} alt={b.home_team} className="w-5 h-5 md:w-6 md:h-6 object-contain shrink-0" />
                                            ) : (
                                                <div className="w-5 h-5 md:w-6 md:h-6 bg-gray-700 rounded-full shrink-0" />
                                            )}
                                            <span className="font-bold text-white text-xs md:text-sm text-right leading-tight">{b.home_team}</span>
                                        </div>
                                        
                                        <div className="shrink-0 flex items-center justify-center px-1">
                                            <span className="bg-gray-900 border border-gray-700 text-gray-500 text-[8px] md:text-[10px] px-1.5 md:px-2 py-0.5 rounded font-black tracking-widest shadow-sm">
                                                VS
                                            </span>
                                        </div>
                                        
                                        <div className="flex items-center justify-start gap-2 md:gap-3 flex-1">
                                            <span className="font-bold text-white text-xs md:text-sm text-left leading-tight">{b.away_team}</span>
                                            {b.away_logo ? (
                                                <img src={b.away_logo} alt={b.away_team} className="w-5 h-5 md:w-6 md:h-6 object-contain shrink-0" />
                                            ) : (
                                                <div className="w-5 h-5 md:w-6 md:h-6 bg-gray-700 rounded-full shrink-0" />
                                            )}
                                        </div>

                                    </div>
                                </td>
                                <td className="px-4 py-5 text-center font-bold text-indigo-400 align-middle whitespace-nowrap">{b.bet_category}</td>
                                <td className="px-4 py-5 text-center text-blue-300 font-semibold align-middle">{b.bet_choice}</td>
                                <td className="px-4 py-5 text-center font-medium align-middle">{b.odds.toFixed(2)}</td>
                                <td className="px-4 py-5 text-center text-yellow-400 font-black align-middle">{b.stake}</td>
                                <td className="px-4 py-5 text-center align-middle whitespace-nowrap">
                                    <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider
                                        ${b.status === 'Won' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 
                                          b.status === 'Lost' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 
                                          b.status === 'Refund' ? 'bg-gray-500/20 text-gray-400 border border-gray-500/30' :
                                          'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'}`}
                                    >
                                        {b.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        ) : (
            <div className="text-center py-20 text-gray-500 font-medium">Anda belum pernah memasang taruhan virtual.</div>
        )}
      </section>
    </main>
  )
}