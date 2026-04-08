import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'

export default function ArticleDetailPage() {
  const { id } = useParams()
  const [article, setArticle] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`https://l1prediksikan.my.id/api/articles/${id}`)
      .then(res => {
         if (!res.ok) throw new Error("Artikel tidak ditemukan")
         return res.json()
      })
      .then(data => {
        setArticle(data)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [id])

  if (loading) {
    return (
      <main className="py-24 md:py-32 text-center" aria-live="polite">
        <Helmet>
          <title>Memuat Artikel... | L1PREDIKSIKAN</title>
        </Helmet>
        <div className="inline-block w-6 h-6 md:w-8 md:h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-3 md:mb-4"></div>
        <div className="text-gray-500 font-semibold tracking-widest uppercase text-xs md:text-sm">Memuat Artikel...</div>
      </main>
    )
  }

  if (!article) {
    return (
      <main className="py-24 md:py-32 text-center px-4">
        <Helmet>
          <title>Artikel Tidak Ditemukan | L1PREDIKSIKAN</title>
        </Helmet>
        <h1 className="text-2xl md:text-3xl font-black text-red-500 mb-3 md:mb-4 uppercase">Artikel Tidak Ditemukan</h1>
        <Link to="/blog" className="text-blue-400 hover:text-blue-300 underline font-semibold text-sm md:text-base">Kembali ke Daftar Artikel</Link>
      </main>
    )
  }

  return (
    <main className="py-6 md:py-10 px-3 md:px-4 max-w-4xl mx-auto font-sans">
      <Helmet>
        <title>{article.title} | L1PREDIKSIKAN Blog</title>
        <meta name="description" content={article.excerpt} />
      </Helmet>
      
      <Link to="/blog" className="inline-flex items-center text-xs md:text-sm font-bold text-gray-400 hover:text-white mb-6 md:mb-8 transition-colors">
        <svg className="w-3 h-3 md:w-4 md:h-4 mr-1.5 md:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        KEMBALI KE DAFTAR
      </Link>

      <article className="bg-gray-800 rounded-2xl md:rounded-3xl border border-gray-700 overflow-hidden shadow-2xl">
        <header className="bg-gray-900 border-b border-gray-700 p-6 sm:p-8 md:p-12 relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-1 md:h-1.5 bg-gradient-to-r from-purple-500 to-blue-500"></div>
           
           <span className={`inline-block border px-3 md:px-4 py-1 md:py-1.5 rounded-full text-[10px] md:text-xs font-bold tracking-widest uppercase shadow-sm mb-4 md:mb-6 ${article.color}`}>
              {article.category}
           </span>
           
           <h1 className="text-2xl sm:text-3xl md:text-5xl font-black text-white leading-snug md:leading-tight mb-4 md:mb-6">
               {article.title}
           </h1>
           
           <div className="flex flex-wrap items-center gap-2 md:gap-4 text-[10px] md:text-sm font-semibold text-gray-500 uppercase tracking-wider">
              <time dateTime={article.created_at}>🗓 {article.created_at}</time>
              <span className="hidden sm:inline">•</span>
              <span>⏱ {article.read_time}</span>
           </div>
        </header>

        <div className="p-6 sm:p-8 md:p-12">
            {article.content.split('\n').map((paragraph, index) => {
                if (!paragraph.trim()) return null;
                return (
                    <p key={index} className="text-gray-300 leading-relaxed mb-5 md:mb-6 text-sm sm:text-base md:text-lg">
                        {paragraph}
                    </p>
                )
            })}
        </div>
      </article>
    </main>
  )
}