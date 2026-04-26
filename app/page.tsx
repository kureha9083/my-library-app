'use client';

import { useState, useEffect } from 'react';

export default function Home() {
  const [input, setInput] = useState('');
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchMode, setSearchMode] = useState('general');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.log("位置情報取得失敗")
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
      // 修正ポイント：AIとの通信先を正しく設定
      const res = await fetch('/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: input }),
      });

      if (!res.ok) throw new Error();
      
      const data = await res.json();
      const parsed = JSON.parse(data.text);
      
      if (Array.isArray(parsed)) {
        setProposals(parsed);
      } else {
        throw new Error();
      }
    } catch (err) {
      // エラー時もデザインを崩さず通知
      setProposals([{ 
        title: "データの取得に失敗しました", 
        author: "システム", 
        reason: "AIの応答形式が正しくありません。もう一度ボタンを押してください。" 
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f1f5f9] p-4 md:p-8 text-slate-800 flex flex-col items-center font-sans">
      <div className="w-full max-w-5xl flex flex-col gap-6">
        
        <header className="text-center py-8">
          <h1 className="text-6xl font-black text-slate-900 tracking-tighter mb-2 italic">
            MOMIJI <span className="text-2xl font-light text-amber-600 not-italic">AI Library Service</span>
          </h1>
          <p className="text-slate-500 font-bold tracking-widest uppercase text-sm">Professional Book Curation</p>
        </header>

        {/* 1. クイックアクセスボタン */}
        <div className="grid grid-cols-3 gap-4 mb-2">
          <button onClick={() => searchNearby('本屋')} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-200 flex flex-col items-center gap-3 hover:bg-slate-50 transition-all hover:scale-105 active:scale-95 group relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-amber-400 opacity-0 group-hover:opacity-100 transition-all"></div>
            <span className="text-4xl group-hover:animate-bounce">📚</span>
            <span className="text-xs font-black text-slate-600 tracking-tighter">近くの本屋</span>
          </button>
          <button onClick={() => searchNearby('ブックカフェ')} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-200 flex flex-col items-center gap-3 hover:bg-slate-50 transition-all hover:scale-105 active:scale-95 group relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-orange-400 opacity-0 group-hover:opacity-100 transition-all"></div>
            <span className="text-4xl group-hover:animate-bounce">☕</span>
            <span className="text-xs font-black text-slate-600 tracking-tighter">近くのカフェ</span>
          </button>
          <button onClick={() => searchNearby('図書館')} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-200 flex flex-col items-center gap-3 hover:bg-slate-50 transition-all hover:scale-105 active:scale-95 group relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-indigo-400 opacity-0 group-hover:opacity-100 transition-all"></div>
            <span className="text-4xl group-hover:animate-bounce">📖</span>
            <span className="text-xs font-black text-slate-600 tracking-tighter">近くの図書館</span>
          </button>
        </div>

        {/* 2. モードセレクター */}
        <div className="flex justify-center gap-4 mb-2 bg-slate-200/50 p-2 rounded-[2rem] w-fit mx-auto">
          <button 
            onClick={() => setSearchMode('general')} 
            className={`px-12 py-4 rounded-[1.5rem] font-black transition-all shadow-sm ${ searchMode === 'general' ? 'bg-amber-500 text-white scale-105 shadow-amber-200' : 'text-slate-500 hover:bg-white' }`}
          >
            🕯️ 一般文芸・話題作
          </button>
          <button 
            onClick={() => setSearchMode('study')} 
            className={`px-12 py-4 rounded-[1.5rem] font-black transition-all shadow-sm ${ searchMode === 'study' ? 'bg-indigo-600 text-white scale-105 shadow-indigo-200' : 'text-slate-500 hover:bg-white' }`}
          >
            🎓 学習・資格・専門書
          </button>
        </div>

        {/* 3. メイン入力セクション */}
        <section className="bg-white rounded-[3rem] shadow-2xl p-8 md:p-12 border-b-[16px] border-slate-200 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-amber-400 via-orange-500 to-indigo-600"></div>
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-2xl shadow-lg">🖋️</div>
            <h2 className="text-3xl font-black tracking-tighter">
              {searchMode === 'study' ? '専門書・学習参考書の検索' : 'AI司書に希望を伝える'}
            </h2>
          </div>
          
          <textarea 
            className="w-full bg-slate-50 border-4 border-slate-100 rounded-[2rem] p-8 text-xl font-bold focus:outline-none focus:border-amber-500 focus:bg-white transition-all h-56 shadow-inner mb-8 placeholder:text-slate-300"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={searchMode === 'study' ? "例：英検準一級の単語帳、TOEIC800点を目指すための問題集" : "例：20代女性が主人公の、最後は前向きになれるミステリー"}
          />
          
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
              </span>
              <p className="text-sm text-slate-400 font-bold italic">Gemini 1.5 Flash - Realtime Analysis</p>
            </div>
            <button 
              onClick={askAI}
              disabled={loading || !input}
              className="group relative bg-slate-900 hover:bg-black text-white font-black py-6 px-20 rounded-[2rem] transition-all disabled:opacity-20 shadow-2xl hover:-translate-y-1 active:translate-y-0"
            >
              <span className={loading ? "opacity-0" : "opacity-100"}>提案を受ける</span>
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                </div>
              )}
            </button>
          </div>
        </section>

        {/* 4. 提案表示セクション */}
        <div className="grid gap-8 mt-4">
          {proposals.map((book, i) => (
            <div 
              key={i} 
              className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-100 flex flex-col gap-6 transition-all hover:shadow-2xl animate-fadeIn relative overflow-hidden"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="bg-amber-100 text-amber-700 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Recommendation {i+1}</span>
                  </div>
                  <h3 className="text-3xl font-black text-slate-800 leading-tight mb-2 tracking-tighter">{book.title}</h3>
                  <p className="text-slate-400 font-black text-xl flex items-center gap-2">
                    <span className="w-8 h-px bg-slate-200"></span>
                    {book.author}
                  </p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                  <button 
                    onClick={() => window.open(`https://www.amazon.co.jp/s?k=${encodeURIComponent(book.title)}`, '_blank')}
                    className="flex-1 md:flex-none px-8 py-4 bg-[#FF9900] hover:bg-[#e68a00] text-white text-sm font-black rounded-2xl shadow-lg shadow-orange-100 transition-all active:scale-95"
                  >
                    Amazonで探す
                  </button>
                  <button 
                    onClick={() => window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(book.title)}+書評`, '_blank')}
                    className="flex-1 md:flex-none px-8 py-4 bg-[#FF0000] hover:bg-[#cc0000] text-white text-sm font-black rounded-2xl shadow-lg shadow-red-100 transition-all active:scale-95"
                  >
                    YouTube評価
                  </button>
                </div>
              </div>

              <div className="border-t-2 border-slate-50 pt-4">
                <button 
                  onClick={() => setExpandedId(expandedId === i ? null : i)}
                  className="group flex items-center gap-3 text-slate-500 font-black text-sm hover:text-amber-600 transition-all"
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${expandedId === i ? 'bg-amber-500 text-white rotate-180' : 'bg-slate-100'}`}>
                    ▼
                  </div>
                  {expandedId === i ? "詳細を閉じる" : "AI司書の推薦理由を見る"}
                </button>
                
                {expandedId === i && (
                  <div className="mt-6 p-8 bg-slate-50 rounded-[2rem] border-l-[12px] border-amber-500 text-slate-700 text-lg leading-relaxed font-bold animate-slideDown shadow-inner">
                    <p className="italic">「 {book.reason} 」</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <footer className="text-center py-12 text-slate-300 text-xs font-black tracking-[0.3em] uppercase">
          &copy; 2026 MOMIJI AI Library Service. All rights reserved.
        </footer>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideDown {
          from { opacity: 0; max-height: 0; }
          to { opacity: 1; max-height: 500px; }
        }
        .animate-fadeIn { animation: fadeIn 0.6s ease forwards; }
        .animate-slideDown { animation: slideDown 0.4s ease forwards; }
      `}</style>
    </main>
  );
}