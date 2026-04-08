import { useState } from 'react'

export default function AdminPage() {
  const [file, setFile] = useState(null)
  const [previewData, setPreviewData] = useState([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)

  const handlePreview = async (e) => {
    e.preventDefault()
    if (!file) return
    setLoading(true)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('http://l1prediksikan.my.id/api/admin/preview', {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      setPreviewData(data)
      if (data.length === 0) {
        alert("Tidak ada data pertandingan baru untuk diunggah (Semua pertandingan di CSV ini sudah ada di Database).")
      }
    // eslint-disable-next-line no-unused-vars
    } catch (err) {
      alert("Gagal membaca file. Pastikan backend berjalan dan file CSV valid.")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setUploading(true)
    try {
      const res = await fetch('http://l1prediksikan.my.id/api/admin/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matches: previewData })
      })
      if (res.ok) {
        alert(`Berhasil! ${previewData.length} pertandingan baru telah disimpan ke Database. Parameter AI untuk setiap tim juga telah diperbarui ke status terbarunya.`)
        setPreviewData([])
        setFile(null)
      }
    // eslint-disable-next-line no-unused-vars
    } catch (err) {
      alert("Gagal menyimpan data.")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="py-10 px-4 max-w-7xl mx-auto">
      <div className="bg-gray-800 shadow-2xl rounded-2xl p-8 border border-gray-700">
        <h1 className="text-2xl font-bold text-white mb-6 uppercase tracking-wider border-b border-gray-700 pb-4">
          Unggah Dataset Musim Terbaru
        </h1>

        <form onSubmit={handlePreview} className="flex items-end gap-4 mb-8">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-400 mb-2">Upload File CSV (Format dataset_siap_ml)</label>
            <input 
              type="file" accept=".csv"
              className="w-full bg-gray-900 border border-gray-600 rounded-lg p-2 text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 transition"
              onChange={(e) => setFile(e.target.files[0])}
              required
            />
          </div>
          <button 
            type="submit" 
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition shadow-lg disabled:opacity-50"
            disabled={loading || !file}
          >
            {loading ? 'Membaca Data...' : 'Pratinjau Data AI'}
          </button>
        </form>

        {previewData.length > 0 && (
          <div className="animate-fade-in-up">
            <div className="flex justify-between items-center mb-4 bg-gray-900 p-4 rounded-lg border border-gray-700">
              <h2 className="text-lg font-bold text-green-400">
                ✅ Menemukan {previewData.length} Pertandingan Baru
              </h2>
              <button 
                onClick={handleSave}
                disabled={uploading}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg transition shadow-lg disabled:opacity-50"
              >
                {uploading ? 'Menyimpan...' : 'SIMPAN KE DATABASE'}
              </button>
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-700 shadow-inner max-h-[600px]">
              <table className="w-full text-sm text-left text-gray-300">
                <thead className="text-xs text-gray-400 uppercase bg-gray-900 border-b border-gray-700 sticky top-0">
                  <tr>
                    <th className="px-4 py-4">Tanggal</th>
                    <th className="px-4 py-4">Liga</th>
                    <th className="px-4 py-4 text-right">Home</th>
                    <th className="px-4 py-4 text-center">Score</th>
                    <th className="px-4 py-4">Away</th>
                    <th className="px-4 py-4 text-center text-blue-400">Home Elo</th>
                    <th className="px-4 py-4 text-center text-red-400">Away Elo</th>
                    <th className="px-4 py-4 text-center text-purple-400">H2H Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.map((match, idx) => (
                    <tr key={idx} className="bg-gray-800 border-b border-gray-700 hover:bg-gray-750 transition">
                      <td className="px-4 py-3 whitespace-nowrap">{match.date}</td>
                      <td className="px-4 py-3 font-semibold">{match.league}</td>
                      <td className="px-4 py-3 font-medium text-white text-right">{match.home_team}</td>
                      <td className="px-4 py-3 text-center font-bold text-blue-400 bg-gray-900/50">{match.fthg} - {match.ftag}</td>
                      <td className="px-4 py-3 font-medium text-white">{match.away_team}</td>
                      <td className="px-4 py-3 text-center text-gray-400">{match.home_elo.toFixed(1)}</td>
                      <td className="px-4 py-3 text-center text-gray-400">{match.away_elo.toFixed(1)}</td>
                      <td className="px-4 py-3 text-center font-semibold text-purple-400">{(match.h2h_home_win_rate * 100).toFixed(0)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}