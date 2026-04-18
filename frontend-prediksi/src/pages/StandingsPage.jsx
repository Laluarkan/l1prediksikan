import { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://l1prediksikan.my.id/api';

const LEAGUES = [
    { code: 'E0', name: 'Premier League' },
    { code: 'SP1', name: 'La Liga' },
    { code: 'I1', name: 'Serie A' },
    { code: 'D1', name: 'Bundesliga' },
    { code: 'F1', name: 'Ligue 1' },
    { code: 'N1', name: 'Eredivisie' },
    { code: 'P1', name: 'Primeira Liga' },
    { code: 'UCL', name: 'Champions League' }
];

const CSSConnector = ({ inCount, outCount, isRightSide }) => {
    if (inCount === outCount) {
        return (
            <div className="w-5 md:w-8 h-full relative flex-shrink-0">
                <div className="absolute top-1/2 w-full border-t-2 border-indigo-500/30"></div>
            </div>
        );
    }

    return (
        <div className="w-5 md:w-8 h-full relative flex-shrink-0">
            {Array.from({length: outCount}).map((_, i) => {
                const topPos = ((i * 2 + 0.5) / inCount) * 100;
                const height = (1 / inCount) * 100;
                return (
                    <div key={i} className="absolute w-full" style={{ top: `${topPos}%`, height: `${height}%` }}>
                        <div className={`w-1/2 h-full border-y-2 border-indigo-500/30 ${isRightSide ? 'border-l-2 rounded-l-md right-0 absolute' : 'border-r-2 rounded-r-md left-0 absolute'}`}></div>
                        <div className={`w-1/2 border-b-2 border-indigo-500/30 absolute top-1/2 ${isRightSide ? 'left-0' : 'right-0'}`}></div>
                    </div>
                );
            })}
        </div>
    );
};

const MatchCard = ({ match }) => {
    if (!match) {
        return (
            <div className="w-36 md:w-44 h-14 bg-gray-800/40 border border-dashed border-gray-700 rounded-lg flex items-center justify-center text-gray-600 text-[10px] md:text-xs uppercase font-bold z-10 shadow-sm">
                Menunggu Tim
            </div>
        );
    }

    const isT1Winner = match.winner === match.t1;
    const isT2Winner = match.winner === match.t2;
    const hasFinished = match.winner !== null;

    return (
        <div className={`w-36 md:w-44 bg-gray-900 border ${isT1Winner || isT2Winner ? 'border-indigo-500/50 shadow-[0_0_12px_rgba(79,70,229,0.25)]' : 'border-gray-700 shadow-md'} rounded-lg p-1.5 flex flex-col justify-center gap-1.5 z-10 relative`}>
            <div className={`flex justify-between items-center ${isT1Winner ? 'text-green-400 font-black' : (hasFinished && !isT1Winner) ? 'text-gray-600' : 'text-gray-200'}`}>
                <div className="flex items-center gap-1.5 truncate pr-1">
                    {match.t1Logo ? <img src={match.t1Logo} className="w-3.5 h-3.5 object-contain opacity-90" /> : <div className="w-3.5 h-3.5 bg-gray-700 rounded-full" />}
                    <span className="text-[10px] md:text-xs truncate font-semibold" title={match.t1}>{match.t1}</span>
                </div>
                <div className="flex gap-0.5 text-[10px] md:text-[11px] font-mono font-bold flex-shrink-0">
                    <span className={`w-3.5 text-center rounded ${match.t1L1 !== null ? 'bg-gray-800 text-white' : 'text-gray-500'}`}>{match.t1L1 !== null ? match.t1L1 : '-'}</span>
                    <span className={`w-3.5 text-center rounded ${match.t1L2 !== null ? 'bg-gray-800 text-white' : 'text-gray-500'}`}>{match.t1L2 !== null ? match.t1L2 : '-'}</span>
                </div>
            </div>
            
            <div className={`flex justify-between items-center ${isT2Winner ? 'text-green-400 font-black' : (hasFinished && !isT2Winner) ? 'text-gray-600' : 'text-gray-200'}`}>
                <div className="flex items-center gap-1.5 truncate pr-1">
                    {match.t2Logo ? <img src={match.t2Logo} className="w-3.5 h-3.5 object-contain opacity-90" /> : <div className="w-3.5 h-3.5 bg-gray-700 rounded-full" />}
                    <span className="text-[10px] md:text-xs truncate font-semibold" title={match.t2}>{match.t2}</span>
                </div>
                <div className="flex gap-0.5 text-[10px] md:text-[11px] font-mono font-bold flex-shrink-0">
                    <span className={`w-3.5 text-center rounded ${match.t2L1 !== null ? 'bg-gray-800 text-white' : 'text-gray-500'}`}>{match.t2L1 !== null ? match.t2L1 : '-'}</span>
                    <span className={`w-3.5 text-center rounded ${match.t2L2 !== null ? 'bg-gray-800 text-white' : 'text-gray-500'}`}>{match.t2L2 !== null ? match.t2L2 : '-'}</span>
                </div>
            </div>
        </div>
    );
};

const RoundColumn = ({ matches, title }) => (
    <div className="flex flex-col justify-around h-full flex-shrink-0 relative w-36 md:w-44">
        <h3 className="absolute -top-8 left-0 w-full text-center text-[10px] font-black text-indigo-400 uppercase tracking-widest">{title}</h3>
        {matches.map((m, i) => (
            <div key={i} className="flex items-center justify-center w-full my-2">
                <MatchCard match={m} />
            </div>
        ))}
    </div>
);

export default function StandingsPage() {
    const [selectedLeague, setSelectedLeague] = useState(LEAGUES[0].code);
    const [standings, setStandings] = useState([]);
    const [knockoutMatches, setKnockoutMatches] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingKnockout, setLoadingKnockout] = useState(false);
    const [uclPhase, setUclPhase] = useState('group'); 

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

    useEffect(() => {
        if (selectedLeague === 'UCL' && uclPhase === 'knockout') {
            const fetchKnockout = async () => {
                setLoadingKnockout(true);
                try {
                    const res = await fetch(`${API_BASE_URL}/knockout/${selectedLeague}`);
                    if (res.ok) {
                        const data = await res.json();
                        setKnockoutMatches(data);
                    } else {
                        setKnockoutMatches([]);
                    }
                } catch (err) {
                    console.error("Gagal mengambil data knockout:", err);
                    setKnockoutMatches([]);
                } finally {
                    setLoadingKnockout(false);
                }
            };
            fetchKnockout();
        }
    }, [selectedLeague, uclPhase]);

    const bracketData = useMemo(() => {
        const validStages = ['LAST_16', 'ROUND_OF_16', 'QUARTER_FINALS', 'SEMI_FINALS', 'FINAL'];
        const filtered = knockoutMatches.filter(m => validStages.includes(m.stage));

        const tiesMap = {};
        filtered.forEach(m => {
            const pair = [m.home_team, m.away_team].sort().join(' vs ');
            if (!tiesMap[pair]) tiesMap[pair] = { stage: m.stage, matches: [] };
            tiesMap[pair].matches.push(m);
        });

        const r16Unordered = [], qfUnordered = [], sfUnordered = [], finalUnordered = [];

        Object.values(tiesMap).forEach(tie => {
            tie.matches.sort((a, b) => new Date(a.match_date) - new Date(b.match_date));
            const m1 = tie.matches[0];
            const m2 = tie.matches[1] || null;

            let winner = null;
            if (m1.status === 'FINISHED' && (!m2 || m2.status === 'FINISHED')) {
                let t1Tot = (m1.home_score || 0) + (m2 ? m2.away_score || 0 : 0);
                let t2Tot = (m1.away_score || 0) + (m2 ? m2.home_score || 0 : 0);
                
                if (t1Tot > t2Tot) winner = m1.home_team;
                else if (t2Tot > t1Tot) winner = m1.away_team;
                else {
                    let p1 = (m1.home_score_penalties || 0) + (m2 ? m2.away_score_penalties || 0 : 0);
                    let p2 = (m1.away_score_penalties || 0) + (m2 ? m2.home_score_penalties || 0 : 0);
                    if (p1 > p2) winner = m1.home_team;
                    else if (p2 > p1) winner = m1.away_team;
                }
            }

            const tieObj = {
                t1: m1.home_team, t2: m1.away_team, 
                t1Logo: m1.home_logo, t2Logo: m1.away_logo, 
                t1L1: m1.home_score, t2L1: m1.away_score, 
                t1L2: m2 ? m2.away_score : null, t2L2: m2 ? m2.home_score : null, 
                winner
            };

            if (['LAST_16', 'ROUND_OF_16'].includes(tie.stage)) r16Unordered.push(tieObj);
            else if (tie.stage === 'QUARTER_FINALS') qfUnordered.push(tieObj);
            else if (tie.stage === 'SEMI_FINALS') sfUnordered.push(tieObj);
            else if (tie.stage === 'FINAL') finalUnordered.push(tieObj);
        });

        const findParent = (childMatch, possibleParents, usedParents) => {
            if (!childMatch) return null;
            const teams = [childMatch.t1, childMatch.t2, childMatch.winner].filter(t => t && t !== 'TBD');
            for (const team of teams) {
                const parent = possibleParents.find(p => p && !usedParents.has(p) && (p.t1 === team || p.t2 === team || p.winner === team));
                if (parent) return parent;
            }
            return null;
        };

        const orderedFinal = [finalUnordered[0] || null];

        const usedSf = new Set();
        const sfLeft = findParent(orderedFinal[0], sfUnordered, usedSf) || sfUnordered.find(m => !usedSf.has(m)) || null;
        if (sfLeft) usedSf.add(sfLeft);
        const sfRight = findParent(orderedFinal[0], sfUnordered, usedSf) || sfUnordered.find(m => !usedSf.has(m)) || null;
        if (sfRight) usedSf.add(sfRight);
        const orderedSf = [sfLeft, sfRight];

        const usedQf = new Set();
        const qf1 = findParent(sfLeft, qfUnordered, usedQf) || qfUnordered.find(m => !usedQf.has(m)) || null;
        if (qf1) usedQf.add(qf1);
        const qf2 = findParent(sfLeft, qfUnordered, usedQf) || qfUnordered.find(m => !usedQf.has(m)) || null;
        if (qf2) usedQf.add(qf2);
        const qf3 = findParent(sfRight, qfUnordered, usedQf) || qfUnordered.find(m => !usedQf.has(m)) || null;
        if (qf3) usedQf.add(qf3);
        const qf4 = findParent(sfRight, qfUnordered, usedQf) || qfUnordered.find(m => !usedQf.has(m)) || null;
        if (qf4) usedQf.add(qf4);
        const orderedQf = [qf1, qf2, qf3, qf4];

        const usedR16 = new Set();
        const orderedR16 = [];
        orderedQf.forEach(qMatch => {
            const r1 = findParent(qMatch, r16Unordered, usedR16) || r16Unordered.find(m => !usedR16.has(m)) || null;
            if (r1) usedR16.add(r1);
            const r2 = findParent(qMatch, r16Unordered, usedR16) || r16Unordered.find(m => !usedR16.has(m)) || null;
            if (r2) usedR16.add(r2);
            orderedR16.push(r1, r2);
        });

        while (orderedFinal.length < 1) orderedFinal.push(null);
        while (orderedSf.length < 2) orderedSf.push(null);
        while (orderedQf.length < 4) orderedQf.push(null);
        while (orderedR16.length < 8) orderedR16.push(null);

        return { r16: orderedR16, qf: orderedQf, sf: orderedSf, final: orderedFinal };
    }, [knockoutMatches]);

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

    const renderKnockoutBracket = () => {
        if (loadingKnockout) {
            return <div className="text-center py-32 text-gray-500 animate-pulse font-semibold">Memuat bagan turnamen...</div>;
        }

        const { r16, qf, sf, final } = bracketData;

        return (
            <div className="w-full overflow-x-auto custom-scrollbar bg-gray-800/80 rounded-2xl border border-gray-700 p-4 md:p-6 shadow-2xl">
                <div className="flex items-center w-max min-w-full justify-center h-[500px] md:h-[550px] mt-8 pb-4">
                    <RoundColumn matches={r16.slice(0, 4)} title="16 Besar" />
                    <CSSConnector inCount={4} outCount={2} isRightSide={false} />
                    
                    <RoundColumn matches={qf.slice(0, 2)} title="Perempat Final" />
                    <CSSConnector inCount={2} outCount={1} isRightSide={false} />
                    
                    <RoundColumn matches={sf.slice(0, 1)} title="Semi Final" />
                    <CSSConnector inCount={1} outCount={1} isRightSide={false} />
                    
                    <RoundColumn matches={final} title="Final" />

                    <CSSConnector inCount={1} outCount={1} isRightSide={true} />
                    <RoundColumn matches={sf.slice(1, 2)} title="Semi Final" />
                    
                    <CSSConnector inCount={2} outCount={1} isRightSide={true} />
                    <RoundColumn matches={qf.slice(2, 4)} title="Perempat Final" />
                    
                    <CSSConnector inCount={4} outCount={2} isRightSide={true} />
                    <RoundColumn matches={r16.slice(4, 8)} title="16 Besar" />
                </div>
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

            <div className="flex flex-wrap justify-center gap-2 mb-6">
                {LEAGUES.map(league => (
                    <button
                        key={league.code}
                        onClick={() => {
                            setSelectedLeague(league.code);
                            if (league.code !== 'UCL') setUclPhase('group');
                        }}
                        className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all
                            ${selectedLeague === league.code 
                                ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.5)]' 
                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white border border-gray-700'}`}
                    >
                        {league.name}
                    </button>
                ))}
            </div>

            {selectedLeague === 'UCL' && (
                <div className="flex justify-center gap-2 mb-8">
                    <button
                        onClick={() => setUclPhase('group')}
                        className={`px-6 py-2 rounded-lg text-sm font-bold uppercase transition-all ${uclPhase === 'group' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700'}`}
                    >
                        Fase Liga (Grup)
                    </button>
                    <button
                        onClick={() => setUclPhase('knockout')}
                        className={`px-6 py-2 rounded-lg text-sm font-bold uppercase transition-all ${uclPhase === 'knockout' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700'}`}
                    >
                        Fase Knockout
                    </button>
                </div>
            )}

            {selectedLeague === 'UCL' && uclPhase === 'knockout' ? (
                renderKnockoutBracket()
            ) : (
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
            )}
        </main>
    );
}