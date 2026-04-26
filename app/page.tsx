'use client';

import { useState, useEffect } from 'react';

export default function Home() {
  const [input, setInput] = useState('');
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchMode, setSearchMode] = useState('general');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // 位置情報の取得（近くの本屋検索用）
  useEffect(() => {
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.log("位置情報スキップ")
      );
    }
  }, []);

  const searchNearby = (keyword: string) => {
    const url = coords 
      ? `https://www.google.com/maps/search/${encodeURIComponent(keyword)}/@${coords.lat},${coords.lng},15z`
      : `https://www.google.com/maps/search/${encodeURIComponent(keyword)}`;
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
        body: JSON.stringify({ prompt: input, mode: searchMode }),
      });

      const data = await res.json();
      // AIの返答を安全に解析
      const cleanText = data.text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanText);
      setProposals(Array.isArray(parsed) ? parsed : []);
    } catch (err) {
      setProposals([{ 
        title: "読み込みに失敗しました", 
        author: "システム", 
        reason: "AIがお喋りモードになってしまったようです。もう一度「提案を受ける」を押してみてください。" 
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f1f5f9] p-4 md:p-8 text-slate-800 flex flex-col items-center font-sans">
      <div className="w-full max-w-5xl flex flex-col gap-6">
        <header className="text-center py-6">
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter mb-2">
            MOMIJI <span className="text-xl font-light text-amber-600 italic">AI Library Service</span>
          </h1>
          <p className="text-slate-500 font-bold">プロが選ぶ「今、読むべき一冊」を瞬時に提案</p>
        </header>

        {/* 周辺検索ボタン */}
        <div className="grid grid-cols-3 gap-4">
          <button onClick={() => searchNearby('本屋')} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center gap-1 hover:bg-slate-50 transition-all">
            <span className="text-2xl">📚</span><span className="text-xs font-black">近くの本屋</span>
          </button>
          <button onClick={() => searchNearby('ブックカフェ')} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center gap-1 hover:bg-slate-50 transition-all">
            <span className="text-2xl">☕</span><span className="text-xs font-black">近くのカフェ</span>
          </button>
          <button onClick={() => searchNearby('図書館')} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center gap-1 hover:bg-slate-50 transition-all">
            <span className="text-2xl">📖</span><span className="text-xs font-black">近くの図書館</span>
          </button>
        </div>

        {/* モード切替 */}
        <div className="flex justify-center gap-4">
          <button onClick={() => setSearchMode('general')} className={`px-8 py-3 rounded-2xl font-black transition-all ${ searchMode === 'general' ? 'bg-amber-500 text-white shadow-lg' : 'bg-white text-slate-400' }`}>
            🕯️ 一般文芸
          </button>
          <button onClick={() => setSearchMode('study')} className={`px-8 py-3 rounded-2xl font-black transition-all ${ searchMode === 'study' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-400' }`}>
            🎓 学習・専門書
          </button>
        </div>

        {/* 検索セクション */}
        <section className="bg-white rounded-[2.5rem] shadow-2xl p-6 md:p-10 border-b-[12px] border-slate-200 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-600"></div>
          <textarea 
            className="w-full bg-slate-50 border-2 border-slate-100 rounded-3xl p-6 text-lg font-bold focus:outline-none focus:border-amber-500 h-40 shadow-inner mb-4" 
            value={input} 
            onChange={(e) => setInput(e.target.value)} 
            placeholder={searchMode === 'study' ? "例：英検準一級の対策、Pythonの入門書など" : "例：ミステリー小説、最近の話題作など"} 
          />
          <button onClick={askAI} disabled={loading || !input} className="w-full bg-slate-900 hover:bg-black text-white font-black py-4 rounded-2xl transition-all disabled:opacity-30 shadow-xl">
            {loading ? "蔵書を検索中..." : "この条件で提案を受ける"}
          </button>
        </section>

        {/* 検索結果 */}
        <div className="grid gap-4">
          {proposals.map((book, i) => (
            <div key={i} className="bg-white rounded-3xl p-6 shadow-md border border-slate-100 flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-black text-slate-800">{book.title}</h3>
                  <p className="text-slate-500 font-bold">著者: {book.author}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => window.open(`https://www.amazon.co.jp/s?k=${encodeURIComponent(book.title)}`, '_blank')} className="px-4 py-2 bg-[#FF9900] text-white text-xs font-black rounded-full shadow-sm">Amazon</button>
                  <button onClick={() => window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(book.title)}+書評`, '_blank')} className="px-4 py-2 bg-[#FF0000] text-white text-xs font-black rounded-full shadow-sm">YouTube</button>
                </div>
              </div>
              <div>
                <button onClick={() => setExpandedId(expandedId === i ? null : i)} className="text-amber-600 font-black text-sm">
                  {expandedId === i ? "▲ 詳細を閉じる" : "▼ AI司書の推薦理由を見る"}
                </button>
                {expandedId === i && (
                  <div className="mt-4 p-5 bg-slate-50 rounded-2xl border-l-4 border-amber-500 text-slate-700 font-medium animate-fadeIn">
                    {book.reason}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}