import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { useLocation } from 'react-router-dom'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://l1prediksikan.my.id/api'

export default function PredictPage() {
  const location = useLocation()
  const incomingFixture = location.state?.fixtureData

  const [leagues, setLeagues] = useState([])
  const [teams, setTeams] = useState([])
  const [selectedLeague, setSelectedLeague] = useState('')
  const [homeTeam, setHomeTeam] = useState('')
  const [awayTeam, setAwayTeam] = useState('')
  const [odds, setOdds] = useState({ h: '', d: '', a: '', over: '', under: '' })
  
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  // STATE UNTUK BETTING
  const [stake, setStake] = useState(100)
  const [betCategory, setBetCategory] = useState('DNB')
  const [placingBet, setPlacingBet] = useState(false)

  // KAMUS NAMA LIGA
  const leagueMap = {
    'E0': 'Premier League', 'I1': 'Serie A', 'D1': 'Bundesliga', 'SP1': 'La Liga', 'F1': 'Ligue 1',
    'N1': 'Eredivisie', 'B1': 'Pro League', 'P1': 'Liga Portugal Betclic', 'SC0': 'Scottish Premiership', 'T1': 'Trendyol Süper Lig', 'G1': 'Stoiximan Super League'
  }

  useEffect(() => {
    window.scrollTo(0, 0)
    fetch(`${API_BASE_URL}/leagues`)
      .then(res => res.json())
      .then(data => setLeagues(data))
      .catch(() => console.error("Gagal memuat liga"))
  }, [incomingFixture])

  useEffect(() => {
    if (incomingFixture && leagues.length > 0) {
      setSelectedLeague(incomingFixture.league_name)
      setOdds({
        h: incomingFixture.odds_h || '', d: incomingFixture.odds_d || '', a: incomingFixture.odds_a || '',
        over: incomingFixture.odds_over || '', under: incomingFixture.odds_under || ''
      })
    }
  }, [incomingFixture, leagues])

  useEffect(() => {
    if (selectedLeague) {
      fetch(`${API_BASE_URL}/teams/${selectedLeague}`)
        .then(res => res.json())
        .then(data => {
          setTeams(data)
          if (incomingFixture && selectedLeague === incomingFixture.league_name) {
            setHomeTeam(incomingFixture.home_team); setAwayTeam(incomingFixture.away_team)
          } else {
            setHomeTeam(''); setAwayTeam('')
          }
          setResult(null)
        }).catch(() => console.error("Gagal memuat tim"))
    } else { setTeams([]) }
  }, [selectedLeague, incomingFixture])

  const handlePredict = async (e) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)
    const payload = {
      league_name: selectedLeague, home_team: homeTeam, away_team: awayTeam,
      odds_h: parseFloat(odds.h), odds_d: parseFloat(odds.d), odds_a: parseFloat(odds.a),
      odds_over: parseFloat(odds.over), odds_under: parseFloat(odds.under)
    }
    try {
      const response = await fetch(`${API_BASE_URL}/predict`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      })
      const data = await response.json()
      setResult(data)
    } catch { 
      alert("Gagal memprediksi. Pastikan server Django menyala.") 
    } finally { 
      setLoading(false) 
    }
  }

  const handlePlaceBet = async () => {
    if (!localStorage.getItem('token')) {
        alert("Silakan Login terlebih dahulu untuk memasang koin!"); return
    }
    
    let choice = ''; let currentOdds = 0.0;
    if (betCategory === 'DNB') {
        choice = result.dnb_prediction.replace(' Win', '')
        currentOdds = choice === homeTeam ? parseFloat(odds.h) : parseFloat(odds.a)
    } else if (betCategory === 'OU') {
        choice = result.ou_prediction
        currentOdds = choice === 'Over 2.5' ? parseFloat(odds.over) : parseFloat(odds.under)
    } else {
        choice = result.btts_prediction
        currentOdds = 1.85 
    }

    if (!currentOdds || currentOdds <= 0) { 
      alert("Odds tidak valid untuk kategori ini. Pastikan odds terisi."); return 
    }

    setPlacingBet(true)
    try {
        const payload = {
            league: selectedLeague, match_date: incomingFixture.date,
            home_team: homeTeam, away_team: awayTeam,
            bet_category: betCategory, bet_choice: choice, odds: currentOdds, stake: stake
        }
        const res = await fetch(`${API_BASE_URL}/bets/place`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
            body: JSON.stringify(payload)
        })
        const data = await res.json()
        if (res.ok) alert("Koin berhasil dipasang! Cek halaman Portofolio Anda.")
        else alert(data.detail || "Gagal memasang koin.")
    // eslint-disable-next-line no-unused-vars
    } catch (e) { 
        alert("Server error.") 
    } finally { 
        setPlacingBet(false) 
    }
  }

  const homeData = teams.find(t => t.name === homeTeam)
  const awayData = teams.find(t => t.name === awayTeam)

  const ProgressBar = ({ labelLeft, labelRight, probLeft, probRight, colorLeft, colorRight }) => (
    <div className="mb-3 md:mb-4">
      <div className="flex justify-between mb-1 text-[10px] md:text-sm font-semibold text-gray-300">
        <span>{labelLeft} ({probLeft}%)</span><span>{labelRight} ({probRight}%)</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-3 md:h-4 flex overflow-hidden">
        <div className={`h-full ${colorLeft}`} style={{ width: `${probLeft}%` }}></div>
        <div className={`h-full ${colorRight}`} style={{ width: `${probRight}%` }}></div>
      </div>
    </div>
  )

  const renderFormIcons = (formString) => {
    if (!formString) return <span className="text-gray-500 text-[10px] md:text-xs italic">Data belum cukup</span>;
    return (
      <div className="flex justify-center gap-1">
        {formString.split('').map((char, idx) => {
          if (char === 'W') return <span key={idx} className="flex items-center justify-center w-4 h-4 md:w-5 md:h-5 bg-green-500 text-white rounded-full text-[8px] md:text-[10px] font-bold shadow-sm">✓</span>;
          if (char === 'D') return <span key={idx} className="flex items-center justify-center w-4 h-4 md:w-5 md:h-5 bg-gray-500 text-white rounded-full text-[8px] md:text-[10px] font-bold shadow-sm">-</span>;
          if (char === 'L') return <span key={idx} className="flex items-center justify-center w-4 h-4 md:w-5 md:h-5 bg-red-500 text-white rounded-full text-[8px] md:text-[10px] font-bold shadow-sm">✕</span>;
          return null;
        })}
      </div>
    );
  };

  return (
    <main className="py-6 md:py-10 px-3 md:px-4 font-sans text-gray-200">
      <Helmet><title>Terminal Prediksi AI | L1PREDIKSIKAN</title></Helmet>

      <section className="max-w-4xl mx-auto bg-gray-800 shadow-2xl rounded-xl md:rounded-2xl overflow-hidden border border-gray-700">
        <header className="bg-gray-950 border-b border-gray-700 p-4 md:p-6 text-center shadow-inner relative">
          {incomingFixture && (<div className="absolute top-0 left-0 w-full bg-blue-600 text-white text-[10px] md:text-xs font-bold py-1 px-4 text-center tracking-widest">⚽ DATA DIIMPOR OTOMATIS DARI JADWAL</div>)}
          <h1 className={`text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500 uppercase tracking-wider ${incomingFixture ? 'mt-4' : ''}`}>L1 PREDIKSI AI</h1>
          <p className="text-gray-400 mt-1 md:mt-2 text-xs md:text-sm font-medium tracking-wide">MESIN PREDIKSI SEPAK BOLA BERBASIS MACHINE LEARNING</p>
        </header>

        <div className="p-5 md:p-8">
          <form onSubmit={handlePredict} className="space-y-5 md:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Liga</label>
                <select className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none" value={selectedLeague} onChange={(e) => setSelectedLeague(e.target.value)} required>
                  <option value="">-- Pilih Liga --</option>
                  {/* PENERJEMAHAN KODE LIGA KE NAMA ASLI */ }
                  {leagues.map(l => <option key={l.name} value={l.name}>{leagueMap[l.name] || l.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Home</label>
                <select className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-800" value={homeTeam} onChange={(e) => setHomeTeam(e.target.value)} disabled={!selectedLeague} required>
                  <option value="">-- Pilih --</option>
                  {teams.filter(t => t.name !== awayTeam).map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2 md:col-span-1">
                <label className="block text-xs font-medium text-gray-400 mb-1">Away</label>
                <select className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-800" value={awayTeam} onChange={(e) => setAwayTeam(e.target.value)} disabled={!selectedLeague} required>
                  <option value="">-- Pilih --</option>
                  {teams.filter(t => t.name !== homeTeam).map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                </select>
              </div>
            </div>

            {homeData && awayData && (
              <div className="bg-gray-900/50 p-4 md:p-6 rounded-xl border border-gray-700 mt-4 md:mt-6 shadow-inner">
                <div className="grid grid-cols-3 gap-y-4 md:gap-y-5 text-center items-center">
                  
                  <div className="font-bold text-blue-400 text-sm md:text-lg truncate px-1">{homeData.name}</div>
                  <div className="font-medium text-gray-500 text-[9px] md:text-xs uppercase tracking-widest">Parameter</div>
                  <div className="font-bold text-red-400 text-sm md:text-lg truncate px-1">{awayData.name}</div>
                  
                  <div className="text-gray-200 font-semibold text-xs md:text-base">{homeData.elo_rating.toFixed(2)}</div>
                  <div className="text-gray-400 text-[10px] md:text-sm">Elo Rating</div>
                  <div className="text-gray-200 font-semibold text-xs md:text-base">{awayData.elo_rating.toFixed(2)}</div>

                  <div className="text-gray-200">{renderFormIcons(homeData.form_string)}</div>
                  <div className="text-gray-400 text-[10px] md:text-sm leading-tight">Performa<br/><span className="text-[8px] md:text-xs">(5 Laga)</span></div>
                  <div className="text-gray-200">{renderFormIcons(awayData.form_string)}</div>

                  <div className="text-gray-200 font-semibold text-xs md:text-base">
                    {homeData.avg_gf.toFixed(2)} <span className="block md:inline text-gray-500 text-[9px] md:text-xs font-normal">({Math.round(homeData.avg_gf * 5)} gol)</span>
                  </div>
                  <div className="text-gray-400 text-[10px] md:text-sm leading-tight">Avg Gol<br className="md:hidden"/> Dicetak</div>
                  <div className="text-gray-200 font-semibold text-xs md:text-base">
                    {awayData.avg_gf.toFixed(2)} <span className="block md:inline text-gray-500 text-[9px] md:text-xs font-normal">({Math.round(awayData.avg_gf * 5)} gol)</span>
                  </div>

                  <div className="text-gray-200 font-semibold text-xs md:text-base">
                    {homeData.avg_ga.toFixed(2)} <span className="block md:inline text-gray-500 text-[9px] md:text-xs font-normal">({Math.round(homeData.avg_ga * 5)} gol)</span>
                  </div>
                  <div className="text-gray-400 text-[10px] md:text-sm leading-tight">Avg Gol<br className="md:hidden"/> Kebobolan</div>
                  <div className="text-gray-200 font-semibold text-xs md:text-base">
                    {awayData.avg_ga.toFixed(2)} <span className="block md:inline text-gray-500 text-[9px] md:text-xs font-normal">({Math.round(awayData.avg_ga * 5)} gol)</span>
                  </div>

                  <div className="text-gray-200 font-semibold text-xs md:text-base">{homeData.avg_sot.toFixed(2)}</div>
                  <div className="text-gray-400 text-[10px] md:text-sm">Shots on Target</div>
                  <div className="text-gray-200 font-semibold text-xs md:text-base">{awayData.avg_sot.toFixed(2)}</div>
                  
                  <div className="text-gray-200 font-semibold text-xs md:text-base">{homeData.goal_diff > 0 ? `+${homeData.goal_diff.toFixed(2)}` : homeData.goal_diff.toFixed(2)}</div>
                  <div className="text-gray-400 text-[10px] md:text-sm leading-tight">Selisih Gol<br className="md:hidden"/> Historis</div>
                  <div className="text-gray-200 font-semibold text-xs md:text-base">{awayData.goal_diff > 0 ? `+${awayData.goal_diff.toFixed(2)}` : awayData.goal_diff.toFixed(2)}</div>

                </div>
              </div>
            )}

            <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 relative">
              {incomingFixture && (
                <div className="absolute -top-3 right-4 bg-green-600 text-white text-[10px] font-bold py-0.5 px-2 rounded">AUTO-FILLED</div>
              )}
              <h3 className="text-xs font-bold text-gray-400 mb-3 border-b border-gray-700 pb-2">INPUT ODDS BANDAR</h3>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {['h', 'd', 'a', 'over', 'under'].map((f) => (
                  <div key={f}>
                    <label className="block text-[10px] text-gray-500 mb-1 uppercase">Odds {f}</label>
                    <input type="number" step="0.01" min="1" className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 text-xs text-white focus:ring-2 focus:ring-blue-500 outline-none" value={odds[f]} onChange={(e) => setOdds({...odds, [f]: e.target.value})} required placeholder="e.g. 1.50"/>
                  </div>
                ))}
              </div>
            </div>

            <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-3 rounded-xl disabled:opacity-50 text-sm hover:from-blue-500 hover:to-indigo-500 transition shadow-lg">{loading ? 'MEMPROSES...' : 'PREDIKSI'}</button>
          </form>

          {result && (
            <div className="mt-8">
              <h2 className="text-xl font-black text-center text-white mb-5 uppercase tracking-wider">Hasil Analisis Model AI</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-900 border-l-4 border-blue-500 rounded-xl p-4 shadow-md">
                  <h3 className="text-sm font-bold text-blue-400 mb-2 border-b border-gray-700 pb-2">1. DNB</h3>
                  <p className="text-white font-bold text-sm bg-gray-800 px-2 py-1 rounded-md inline-block mb-3">{result.dnb_prediction}</p>
                  <ProgressBar labelLeft={homeTeam} labelRight={awayTeam} probLeft={result.dnb_home_prob} probRight={result.dnb_away_prob} colorLeft="bg-blue-500" colorRight="bg-red-500" />
                </div>
                <div className="bg-gray-900 border-l-4 border-green-500 rounded-xl p-4 shadow-md">
                  <h3 className="text-sm font-bold text-green-400 mb-2 border-b border-gray-700 pb-2">2. Over/Under 2.5</h3>
                  <p className="text-white font-bold text-sm bg-gray-800 px-2 py-1 rounded-md inline-block mb-3">{result.ou_prediction}</p>
                  <ProgressBar labelLeft="Over" labelRight="Under" probLeft={result.ou_over_prob} probRight={result.ou_under_prob} colorLeft="bg-green-500" colorRight="bg-yellow-500" />
                </div>
                <div className="bg-gray-900 border-l-4 border-purple-500 rounded-xl p-4 shadow-md">
                  <h3 className="text-sm font-bold text-purple-400 mb-2 border-b border-gray-700 pb-2">3. BTTS</h3>
                  <p className="text-white font-bold text-sm bg-gray-800 px-2 py-1 rounded-md inline-block mb-3">{result.btts_prediction}</p>
                  <ProgressBar labelLeft="Yes" labelRight="No" probLeft={result.btts_yes_prob} probRight={result.btts_no_prob} colorLeft="bg-purple-500" colorRight="bg-gray-500" />
                </div>
              </div>

              {incomingFixture ? (
                  <div className="mt-8 bg-gray-900 border border-yellow-500/30 p-5 md:p-6 rounded-2xl shadow-inner">
                      <h3 className="text-sm md:text-lg font-black text-yellow-400 uppercase tracking-widest mb-4">💰 Pasang Koin Virtual</h3>
                      <div className="flex flex-col md:flex-row gap-4 items-end">
                          <div className="flex-1 w-full">
                              <label className="block text-[10px] md:text-xs text-gray-400 mb-1 uppercase font-bold">Ikuti Prediksi AI</label>
                              <select value={betCategory} onChange={e=>setBetCategory(e.target.value)} className="w-full bg-gray-800 p-2.5 rounded-lg text-white font-bold border border-gray-600 outline-none focus:ring-2 focus:ring-yellow-500 text-sm">
                                  <option value="DNB">DNB ({result.dnb_prediction})</option>
                                  <option value="OU">Over/Under 2.5 ({result.ou_prediction})</option>
                                  <option value="BTTS">BTTS ({result.btts_prediction})</option>
                              </select>
                          </div>
                          <div className="w-full md:w-32">
                              <label className="block text-[10px] md:text-xs text-gray-400 mb-1 uppercase font-bold">Nominal</label>
                              <input type="number" min="10" step="10" value={stake} onChange={e=>setStake(parseInt(e.target.value))} className="w-full bg-gray-800 p-2.5 rounded-lg text-yellow-400 font-black border border-gray-600 outline-none text-center focus:ring-2 focus:ring-yellow-500" />
                          </div>
                          <button onClick={handlePlaceBet} disabled={placingBet} className="w-full md:w-auto bg-yellow-500 hover:bg-yellow-400 text-black font-black px-6 py-2.5 rounded-lg uppercase tracking-wider transition disabled:opacity-50 shadow-lg text-sm md:text-base">
                              {placingBet ? 'MEMPROSES...' : 'PASANG'}
                          </button>
                      </div>
                  </div>
              ) : (
                  <div className="mt-8 text-center text-xs text-gray-500 p-4 border border-gray-800 rounded-xl bg-gray-900/50">
                      Untuk memasang Koin Virtual pada prediksi, silakan pilih pertandingan melalui menu <b>Jadwal Laga</b>.
                  </div>
              )}
            </div>
          )}

        </div>
      </section>
    </main>
  )
}