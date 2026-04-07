import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'

// Menerima prop 'user' dari App.jsx
export default function BlogPage({ user }) {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    title: '', category: '', read_time: '', excerpt: '', content: '',
    color: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
  })

  const fetchArticles = () => {
    setLoading(true)
    fetch('https://l1prediksi-api.onrender.com/api/articles')
      .then(res => res.json())
      .then(data => {
        setArticles(data)
        setLoading(false)
      })
      .catch(err => {
        console.error("Gagal memuat artikel:", err)
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchArticles()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const res = await fetch('https://l1prediksi-api.onrender.com/api/admin/articles/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      const data = await res.json()
      if (res.ok) {
        alert(data.message)
        setFormData({
          title: '', category: '', read_time: '', excerpt: '', content: '',
          color: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
        })
        fetchArticles()
      } else {
        alert("Gagal menerbitkan artikel.")
      }
    // eslint-disable-next-line no-unused-vars
    } catch (err) {
      alert("Gagal menghubungi server.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="py-6 md:py-10 px-3 md:px-4 max-w-6xl mx-auto font-sans">
      <Helmet>
        <title>Artikel & Insight | L1PREDIKSIKAN Blog</title>
        <meta name="description" content="Baca artikel terbaru seputar pengembangan AI, analisis pertandingan sepak bola, dan opini dunia teknologi." />
      </Helmet>

      {/* SEKSI ADMIN: Tambah Artikel (HANYA TAMPIL JIKA USER ADALAH ADMIN) */}
      {user?.is_admin && (
        <section aria-labelledby="admin-blog-heading" className="bg-gray-800 shadow-2xl rounded-xl md:rounded-2xl p-5 md:p-8 border border-gray-700 mb-8 md:mb-12 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 md:w-2 h-full bg-gradient-to-b from-purple-500 to-pink-600"></div>
          <h2 id="admin-blog-heading" className="text-xl md:text-2xl font-black text-white mb-1 md:mb-2 uppercase tracking-wider">Mode Admin: Tulis Artikel Baru</h2>
          <p className="text-xs md:text-sm text-gray-400 mb-5 md:mb-6">Artikel yang diterbitkan akan langsung disimpan ke database dan bisa dibaca secara penuh.</p>
          
          <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4 text-sm md:text-base">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
              <div className="col-span-1 md:col-span-2">
                <label className="block text-[10px] md:text-xs font-semibold text-gray-500 mb-1 uppercase">Judul Artikel</label>
                <input 
                  type="text" required value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg p-2.5 md:p-3 text-white focus:ring-2 focus:ring-purple-500 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-[10px] md:text-xs font-semibold text-gray-500 mb-1 uppercase">Kategori</label>
                <input 
                  type="text" required value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg p-2.5 md:p-3 text-white focus:ring-2 focus:ring-purple-500 outline-none transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
              <div>
                <label className="block text-[10px] md:text-xs font-semibold text-gray-500 mb-1 uppercase">Waktu Baca</label>
                <input 
                  type="text" required value={formData.read_time}
                  onChange={(e) => setFormData({...formData, read_time: e.target.value})}
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg p-2.5 md:p-3 text-white focus:ring-2 focus:ring-purple-500 outline-none transition"
                  placeholder="e.g. 5 Min Read"
                />
              </div>
              <div className="col-span-1 md:col-span-2">
                <label className="block text-[10px] md:text-xs font-semibold text-gray-500 mb-1 uppercase">Tema Warna Kategori</label>
                <select 
                  value={formData.color}
                  onChange={(e) => setFormData({...formData, color: e.target.value})}
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg p-2.5 md:p-3 text-white focus:ring-2 focus:ring-purple-500 outline-none transition"
                >
                  <option value="bg-blue-500/20 text-blue-400 border-blue-500/30">Biru</option>
                  <option value="bg-green-500/20 text-green-400 border-green-500/30">Hijau</option>
                  <option value="bg-purple-500/20 text-purple-400 border-purple-500/30">Ungu</option>
                  <option value="bg-orange-500/20 text-orange-400 border-orange-500/30">Oranye</option>
                  <option value="bg-red-500/20 text-red-400 border-red-500/30">Merah</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] md:text-xs font-semibold text-gray-500 mb-1 uppercase">Ringkasan Pendek (Excerpt)</label>
              <textarea 
                required rows="2" value={formData.excerpt}
                onChange={(e) => setFormData({...formData, excerpt: e.target.value})}
                className="w-full bg-gray-900 border border-gray-600 rounded-lg p-2.5 md:p-3 text-white focus:ring-2 focus:ring-purple-500 outline-none transition resize-none"
              ></textarea>
            </div>

            <div>
              <label className="block text-[10px] md:text-xs font-semibold text-gray-500 mb-1 uppercase">Isi Artikel Lengkap</label>
              <textarea 
                required rows="6" value={formData.content}
                onChange={(e) => setFormData({...formData, content: e.target.value})}
                className="w-full bg-gray-900 border border-gray-600 rounded-lg p-2.5 md:p-3 text-white focus:ring-2 focus:ring-purple-500 outline-none transition"
              ></textarea>
            </div>

            <button 
              type="submit" 
              className="w-full md:w-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-3 px-6 md:px-8 rounded-lg md:rounded-xl transition-all shadow-lg text-sm md:text-base disabled:opacity-50 tracking-wide"
              disabled={submitting}
            >
              {submitting ? 'MENYIMPAN...' : 'TERBITKAN ARTIKEL 🚀'}
            </button>
          </form>
        </section>
      )}

      <section aria-labelledby="blog-heading">
        <div className="text-center mb-8 md:mb-12">
          <h1 id="blog-heading" className="text-2xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500 uppercase tracking-wider mb-2 md:mb-4">
            Artikel & Insight
          </h1>
          <p className="text-gray-400 text-sm md:text-lg max-w-2xl mx-auto px-4">
            Catatan pengembangan sistem, analisis pertandingan, dan opini seputar dunia teknologi dan sepak bola.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-16 md:py-20" aria-live="polite">
              <div className="inline-block w-6 md:w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3 md:mb-4"></div>
              <div className="text-gray-500 font-semibold tracking-widest uppercase text-xs md:text-sm">Memuat Artikel...</div>
          </div>
        ) : articles.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-8">
            {articles.map((article) => (
              <article key={article.id} className="h-full">
                <Link 
                  to={`/blog/${article.id}`}
                  title={`Baca Artikel: ${article.title}`}
                  className="bg-gray-800 rounded-xl md:rounded-2xl border border-gray-700 overflow-hidden hover:border-gray-500 hover:shadow-[0_0_20px_rgba(59,130,246,0.15)] transition-all duration-300 group flex flex-col h-full"
                >
                  <div className="h-40 md:h-48 bg-gray-900 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-gray-900 z-10"></div>
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-500 via-gray-900 to-black group-hover:scale-110 transition-transform duration-700"></div>
                    
                    <div className="absolute top-3 left-3 md:top-4 md:left-4 z-20">
                      <span className={`border px-2 md:px-3 py-0.5 md:py-1 rounded-full text-[9px] md:text-xs font-bold tracking-widest uppercase shadow-sm ${article.color}`}>
                        {article.category}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 md:p-6 flex flex-col flex-grow">
                    <div className="flex items-center gap-2 md:gap-3 text-[10px] md:text-xs font-semibold text-gray-500 mb-2 md:mb-3 uppercase tracking-wider">
                      <time dateTime={article.created_at}>🗓 {article.created_at}</time>
                      <span>•</span>
                      <span>⏱ {article.read_time}</span>
                    </div>
                    
                    <h2 className="text-lg md:text-xl font-bold text-gray-100 group-hover:text-blue-400 transition-colors duration-200 mb-2 md:mb-3 leading-snug">
                      {article.title}
                    </h2>
                    
                    <p className="text-xs md:text-sm text-gray-400 leading-relaxed mb-5 md:mb-6 flex-grow line-clamp-3">
                      {article.excerpt}
                    </p>
                    
                    <div className="mt-auto">
                      <span className="inline-flex items-center text-xs md:text-sm font-bold text-blue-500 group-hover:text-indigo-400 transition-colors">
                        Baca Selengkapnya 
                        <svg className="w-3 h-3 md:w-4 md:h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                      </span>
                    </div>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 md:py-20 bg-gray-800 rounded-xl md:rounded-2xl border border-gray-700">
              <p className="text-gray-400 font-medium text-sm md:text-lg">Belum ada artikel yang diterbitkan.</p>
          </div>
        )}
      </section>
    </main>
  )
}