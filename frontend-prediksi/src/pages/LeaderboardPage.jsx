import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api'

export default function LeaderboardPage() {
  const [leaders, setLeaders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API_BASE_URL}/leaderboard`)
      .then(res => res.json())
      .then(data => {
        setLeaders(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <main className="py-6 md:py-10 px-3 md:px-4 max-w-4xl mx-auto font-sans">
      <Helmet>
        <title>Papan Peringkat | L1PREDIKSIKAN</title>
      </Helmet>

      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 uppercase tracking-wider mb-2">
            Papan Peringkat
        </h1>
        <p className="text-gray-400 text-sm md:text-base">Pengguna dengan Koin Virtual terbanyak musim ini.</p>
      </div>

      <section className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden shadow-2xl">
        {loading ? (
            <div className="text-center py-20 text-gray-500 animate-pulse">Memuat Papan Peringkat...</div>
        ) : leaders.length > 0 ? (
            <table className="w-full text-sm md:text-base text-gray-300">
                <thead className="text-[10px] md:text-xs text-gray-500 uppercase bg-gray-900 border-b border-gray-700">
                    <tr>
                        <th className="px-6 py-4 text-center w-16">Rank</th>
                        <th className="px-6 py-4 text-left">Pengguna</th>
                        <th className="px-6 py-4 text-right">Total Koin</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                    {leaders.map((l, idx) => (
                        <tr key={idx} className={`hover:bg-gray-700/50 ${idx < 3 ? 'bg-gray-700/20' : ''}`}>
                            <td className="px-6 py-5 text-center font-black">
                                {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                            </td>
                            <td className="px-6 py-5 font-bold text-white">
                                {l.username}
                            </td>
                            <td className="px-6 py-5 text-right font-black text-yellow-400">
                                {l.points.toLocaleString()}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        ) : (
            <div className="text-center py-20 text-gray-500">Belum ada data peringkat.</div>
        )}
      </section>
    </main>
  )
}