'use client';

import { useState, useEffect } from 'react';

export default function Home() {
  const [input, setInput] = useState('');
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('蔵書を検索中...');
  const [searchMode, setSearchMode] = useState('general');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // 検索中のメッセージを変化させる
  useEffect(() => {
    if (loading) {
      const msgs = ["司書が書架を探しています...", "最適な5冊を選定中...", "推薦理由を執筆しています..."];
      let i = 0;
      const interval = setInterval(() => {
        setLoadingMsg(msgs[i % msgs.length]);
        i++;
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [loading]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.log("位置情報スキップ")
      );
    }
  }, []);

  const searchNearby = (keyword: string) => {
    const query = encodeURIComponent(keyword);
    const url = coords 
      ? `https://www.google.com/maps/search/${query}/@${coords.lat},${coords.lng},15z`
      : `https://www.google.com/maps/search/${query}`;
    window.open(url, '_blank');
  };

  const askAI = async () => {
    setLoading(true);
    setProposals([]);
    setExpandedId(null);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: input }),
      });
      const data = await res.json();
      const parsed = JSON.parse(data.text);
      setProposals(Array.isArray(parsed) ? parsed : []);
    } catch (err) {
      setProposals([{ title: "エラー", author: "再試行", reason: "通信に失敗しました。もう一度ボタンを押してください。" }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f1f5f9] p-4 md:p-8 text-slate-800 flex flex-col items-center">
      <div className="w-full max-w-5xl flex flex-col gap-6">
        <header className="text-center py-8">
          <h1 className="text-6xl font-black text-slate-900 italic">MOMIJI</h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">AI Library Service</p>
        </header>

        {/* 1. 周辺検索ボタン */}
        <div className="grid grid-cols-3 gap-4">
          {['本屋', 'ブックカフェ', '図書館'].map((label, i) => (
            <button key={i} onClick={() => searchNearby(label)} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-200 flex flex-col items-center gap-3 hover:scale-105 transition-all group">
              <span className="text-4xl group-hover:animate-bounce">{i===0?'📚':i===1?'☕':'📖'}</span>
              <span className="text-xs font-black text-slate-600">近くの{label}</span>
            </button>
          ))}
        </div>

        {/* 2. モード選択 */}
        <div className="flex justify-center gap-4 bg-slate-200/50 p-2 rounded-[2rem] w-fit mx-auto">
          <button onClick={() => setSearchMode('general')} className={`px-12 py-4 rounded-[1.5rem] font-black transition-all ${ searchMode === 'general' ? 'bg-amber-500 text-white shadow-lg' : 'text-slate-500' }`}>🕯️ 一般文芸</button>
          <button onClick={() => setSearchMode('study')} className={`px-12 py-4 rounded-[1.5rem] font-black transition-all ${ searchMode === 'study' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500' }`}>🎓 学習・専門書</button>
        </div>

        {/* 3. 入力セクション (文字色を濃く修正) */}
        <section className="bg-white rounded-[3rem] shadow-2xl p-10 border-b-[16px] border-slate-200 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-amber-400 to-indigo-600"></div>
          <h2 className="text-3xl font-black mb-8">🖋️ {searchMode === 'study' ? '専門書の検索' : '希望を伝える'}</h2>
          
          <textarea 
            className="w-full bg-slate-50 border-4 border-slate-100 rounded-[2.5rem] p-8 text-2xl font-bold h-64 focus:outline-none focus:border-amber-500 transition-all text-slate-900 placeholder:text-slate-300 shadow-inner" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="探している本を教えてください..."
          />
          
          <div className="flex flex-col md:flex-row justify-between items-center mt-8 gap-6">
            <p className={`text-lg font-black italic transition-all duration-500 ${loading ? 'text-amber-600 animate-pulse' : 'text-slate-300'}`}>
              {loading ? `● ${loadingMsg}` : "● 司書が待機中です"}
            </p>
            <button 
              onClick={askAI}
              disabled={loading || !input}
              className="bg-slate-900 hover:bg-black text-white font-black py-7 px-24 rounded-[2rem] transition-all shadow-2xl disabled:opacity-20 hover:-translate-y-1"
            >
              {loading ? "検索中..." : "提案を受ける"}
            </button>
          </div>
        </section>

        {/* 4. 結果表示 */}
        <div className="grid gap-8">
          {proposals.map((book, i) => (
            <div key={i} className="bg-white rounded-[2.5rem] p-9 shadow-xl border border-slate-100 flex flex-col gap-6 animate-fadeIn transition-all">
              <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div className="flex-1">
                  <h3 className="text-3xl font-black text-slate-900 mb-1">{book.title}</h3>
                  <p className="text-slate-500 font-black text-xl">著者: {book.author}</p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => window.open(`https://www.amazon.co.jp/s?k=${encodeURIComponent(book.title)}`)} className="px-8 py-4 bg-[#FF9900] text-white font-black rounded-2xl shadow-lg hover:brightness-110 transition-all active:scale-95">Amazon</button>
                  <button onClick={() => window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(book.title)}`)} className="px-8 py-4 bg-[#FF0000] text-white font-black rounded-2xl shadow-lg hover:brightness-110 transition-all active:scale-95">YouTube</button>
                </div>
              </div>
              <div className="border-t-2 border-slate-50 pt-4">
                <button onClick={() => setExpandedId(expandedId === i ? null : i)} className="text-amber-600 font-black text-sm p-3 bg-amber-50 rounded-xl hover:bg-amber-100 transition-all">
                  {expandedId === i ? "▲ 詳細を閉じる" : "▼ AI司書の推薦理由を見る"}
                </button>
                {expandedId === i && (
                  <div className="mt-6 p-8 bg-slate-50 rounded-[2rem] border-l-[12px] border-amber-500 text-xl font-bold italic text-slate-800 animate-slideDown shadow-inner">
                    「{book.reason}」
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <footer className="text-center py-12 text-slate-300 text-xs font-black tracking-widest uppercase">
          © 2026 MOMIJI AI Library Service
        </footer>
      </div>

      <style jsx>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideDown { from { opacity: 0; max-height: 0; } to { opacity: 1; max-height: 600px; } }
        .animate-fadeIn { animation: fadeIn 0.6s ease forwards; }
        .animate-slideDown { animation: slideDown 0.4s ease forwards; }
      `}</style>
    </main>
  );
}