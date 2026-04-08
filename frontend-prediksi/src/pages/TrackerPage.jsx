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
      // eslint-disable-next-line no-unused-vars
      } catch (err) {
        console.error("Gagal memuat portofolio")
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
                    <thead className="text-[10px] text-gray-500 uppercase bg-gray-900 sticky top-0">
                        <tr>
                            <th className="px-4 py-3 text-left">Waktu Pasang</th>
                            <th className="px-4 py-3 text-left">Pertandingan</th>
                            <th className="px-4 py-3 text-center">Kategori</th>
                            <th className="px-4 py-3 text-center">Pilihan</th>
                            <th className="px-4 py-3 text-center">Odds</th>
                            <th className="px-4 py-3 text-center">Koin</th>
                            <th className="px-4 py-3 text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700/50">
                        {bets.map(b => (
                            <tr key={b.id} className="hover:bg-gray-700/50">
                                <td className="px-4 py-4 text-gray-400">{b.created_at}</td>
                                <td className="px-4 py-4 font-bold text-white">
                                    {b.home_team} <span className="text-gray-500 font-normal mx-1">vs</span> {b.away_team}
                                </td>
                                <td className="px-4 py-4 text-center font-bold text-indigo-400">{b.bet_category}</td>
                                <td className="px-4 py-4 text-center text-blue-300">{b.bet_choice}</td>
                                <td className="px-4 py-4 text-center">{b.odds.toFixed(2)}</td>
                                <td className="px-4 py-4 text-center text-yellow-400 font-bold">{b.stake}</td>
                                <td className="px-4 py-4 text-center">
                                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider
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
            <div className="text-center py-20 text-gray-500">Anda belum pernah memasang taruhan virtual.</div>
        )}
      </section>
    </main>
  )
}