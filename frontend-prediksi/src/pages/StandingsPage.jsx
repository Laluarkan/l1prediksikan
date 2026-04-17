import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://l1prediksikan.my.id/api';

const LEAGUES = [
    { code: 'E0', name: 'Premier League' },
    { code: 'SP1', name: 'La Liga' },
    { code: 'I1', name: 'Serie A' },
    { code: 'D1', name: 'Bundesliga' },
    { code: 'F1', name: 'Ligue 1' },
    { code: 'N1', name: 'Eredivisie' },
    { code: 'P1', name: 'Primeira Liga' }
];

export default function StandingsPage() {
    const [selectedLeague, setSelectedLeague] = useState(LEAGUES[0].code);
    const [standings, setStandings] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchStandings = async () => {
            setLoading(true);
            try {
                const res = await fetch(`${API_BASE_URL}/standings/${selectedLeague}`);
                if (res.ok) {
                    const data = await res.json();
                    setStandings(data);
                } else {
                    setStandings([]);
                }
            } catch (err) {
                console.error("Gagal mengambil data klasemen:", err);
                setStandings([]);
            } finally {
                setLoading(false);
            }
        };

        fetchStandings();
    }, [selectedLeague]);

    const renderFormBlocks = (formString) => {
        if (!formString) return null;
        return (
            <div className="flex gap-1 justify-center">
                {formString.split('').map((char, idx) => {
                    let bgColor = 'bg-gray-600';
                    if (char === 'W') bgColor = 'bg-green-500';
                    if (char === 'D') bgColor = 'bg-gray-500';
                    if (char === 'L') bgColor = 'bg-red-500';
                    return (
                        <span key={idx} className={`w-4 h-4 rounded-sm flex items-center justify-center text-[9px] font-bold text-white ${bgColor}`}>
                            {char}
                        </span>
                    );
                })}
            </div>
        );
    };

    return (
        <main className="py-6 md:py-10 px-3 md:px-4 max-w-7xl mx-auto font-sans">
            <Helmet>
                <title>Klasemen | L1PREDIKSI-KAN</title>
            </Helmet>

            <div className="text-center mb-8">
                <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-white mb-3">Klasemen Liga</h1>
                <p className="text-gray-400 text-sm md:text-base max-w-2xl mx-auto">
                    Pantau posisi terbaru tim favorit Anda dari liga-liga top Eropa.
                </p>
            </div>

            <div className="flex flex-wrap justify-center gap-2 mb-8">
                {LEAGUES.map(league => (
                    <button
                        key={league.code}
                        onClick={() => setSelectedLeague(league.code)}
                        className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all
                            ${selectedLeague === league.code 
                                ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.5)]' 
                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white border border-gray-700'}`}
                    >
                        {league.name}
                    </button>
                ))}
            </div>

            <section className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="text-center py-32 text-gray-500 animate-pulse font-semibold">Mengambil data klasemen...</div>
                    ) : standings.length > 0 ? (
                        <table className="w-full text-sm text-gray-300 min-w-[800px]">
                            <thead className="text-[11px] text-gray-400 uppercase bg-gray-900 sticky top-0">
                                <tr>
                                    <th className="px-4 py-4 text-center w-12">#</th>
                                    <th className="px-4 py-4 text-left">Klub</th>
                                    <th className="px-3 py-4 text-center" title="Main">M</th>
                                    <th className="px-3 py-4 text-center" title="Menang">M</th>
                                    <th className="px-3 py-4 text-center" title="Seri">S</th>
                                    <th className="px-3 py-4 text-center" title="Kalah">K</th>
                                    <th className="px-3 py-4 text-center" title="Gol Memasukkan">GM</th>
                                    <th className="px-3 py-4 text-center" title="Gol Kemasukan">GK</th>
                                    <th className="px-3 py-4 text-center" title="Selisih Gol">SG</th>
                                    <th className="px-4 py-4 text-center font-bold text-white" title="Poin">Poin</th>
                                    <th className="px-4 py-4 text-center">Form (5 Laga)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700/50">
                                {standings.map((team, index) => (
                                    <tr key={index} className="hover:bg-gray-700/50 transition-colors">
                                        <td className="px-4 py-3 text-center font-bold text-gray-500">{team.rank}</td>
                                        <td className="px-4 py-3 font-bold text-white flex items-center gap-3">
                                            {team.team_logo ? (
                                                <img src={team.team_logo} alt={team.team_name} className="w-6 h-6 object-contain" />
                                            ) : (
                                                <div className="w-6 h-6 bg-gray-700 rounded-full" />
                                            )}
                                            {team.team_name}
                                        </td>
                                        <td className="px-3 py-3 text-center">{team.played}</td>
                                        <td className="px-3 py-3 text-center text-green-400">{team.win}</td>
                                        <td className="px-3 py-3 text-center text-gray-400">{team.draw}</td>
                                        <td className="px-3 py-3 text-center text-red-400">{team.lose}</td>
                                        <td className="px-3 py-3 text-center">{team.goals_for}</td>
                                        <td className="px-3 py-3 text-center">{team.goals_against}</td>
                                        <td className="px-3 py-3 text-center font-semibold">{team.goal_diff > 0 ? `+${team.goal_diff}` : team.goal_diff}</td>
                                        <td className="px-4 py-3 text-center font-black text-indigo-400 text-base">{team.points}</td>
                                        <td className="px-4 py-3 text-center">
                                            {renderFormBlocks(team.form)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="text-center py-20 text-gray-500">
                            Data klasemen belum tersedia untuk liga ini.
                        </div>
                    )}
                </div>
            </section>
        </main>
    );
}