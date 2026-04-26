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
      // あなたのフォルダ構成に合わせた正しい通信先
      const res = await fetch('/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: input }),
      });

      if (!res.ok) throw new Error("APIエラー");

      const data = await res.json();
      const parsed = JSON.parse(data.text);

      if (Array.isArray(parsed)) {
        setProposals(parsed);
      } else {
        throw new Error("配列ではありません");
      }
    } catch (err) {
      // ★古い長文エラー表示を完全に削除。万が一失敗しても、この短い文しか出ません。
      setProposals([{ 
        title: "検索を完了できませんでした", 
        author: "システム", 
        reason: "一時的な通信エラーです。もう一度「提案を受ける」ボタンを押してください。" 
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

        <div className="grid grid-cols-3 gap-4 mb-2">
          <button onClick={() => searchNearby('本屋')} className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-200 flex flex-col items-center gap-2 hover:bg-slate-50 transition-all hover:scale-105 active:scale-95 group">
            <span className="text-3xl group-hover:animate-bounce">📚</span>
            <span className="text-xs font-black text-slate-600">近くの本屋</span>
          </button>
          <button onClick={() => searchNearby('ブックカフェ')} className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-200 flex flex-col items-center gap-2 hover:bg-slate-50 transition-all hover:scale-105 active:scale-95 group">
            <span className="text-3xl group-hover:animate-bounce">☕</span>
            <span className="text-xs font-black text-slate-600">近くのカフェ</span>
          </button>
          <button onClick={() => searchNearby('図書館')} className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-200 flex flex-col items-center gap-2 hover:bg-slate-50 transition-all hover:scale-105 active:scale-95 group">
            <span className="text-3xl group-hover:animate-bounce">📖</span>
            <span className="text-xs font-black text-slate-600">近くの図書館</span>
          </button>
        </div>

        <div className="flex justify-center gap-4 mb-2">
          <button onClick={() => setSearchMode('general')} className={`px-10 py-4 rounded-2xl font-black transition-all shadow-md ${ searchMode === 'general' ? 'bg-amber-500 text-white scale-105' : 'bg-white text-slate-400' }`}>
            🕯️ 一般文芸・話題作
          </button>
          <button onClick={() => setSearchMode('study')} className={`px-10 py-4 rounded-2xl font-black transition-all shadow-md ${ searchMode === 'study' ? 'bg-indigo-600 text-white scale-105' : 'bg-white text-slate-400' }`}>
            🎓 学習・資格・専門書
          </button>
        </div>

        <section className="bg-white rounded-[2.5rem] shadow-2xl p-6 md:p-10 border-b-[12px] border-slate-200 relative overflow-hidden transition-all">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-600"></div>
          <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
            {searchMode === 'study' ? '🎓 専門書・学習参考書の検索' : '🖋️ 司書に希望を伝える'}
          </h2>
          <textarea 
            className="w-full bg-slate-50 border-2 border-slate-100 rounded-3xl p-6 text-lg font-bold focus:outline-none focus:border-amber-500 focus:bg-white transition-all h-44 shadow-inner mb-6"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={searchMode === 'study' ? "例：英検準一級の対策本" : "例：泣けるミステリー"}
          />
          <div className="flex justify-between items-center">
            <p className="text-xs text-slate-400 font-medium italic">※最新のAIが最適な5冊を厳選します</p>
            <button 
              onClick={askAI}
              disabled={loading || !input}
              className="bg-slate-900 hover:bg-black text-white font-black py-5 px-14 rounded-2xl transition-all disabled:opacity-30 shadow-xl"
            >
              {loading ? "蔵書を検索中..." : "この条件で提案を受ける"}
            </button>
          </div>
        </section>

        <div className="grid gap-6">
          {proposals.map((book, i) => (
            <div key={i} className="bg-white rounded-[2rem] p-7 shadow-md border border-slate-100 flex flex-col gap-5 transition-all hover:shadow-xl">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-black text-slate-800 mb-1">{book.title}</h3>
                  <p className="text-slate-500 font-bold text-lg">著者: {book.author}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => window.open(`https://www.amazon.co.jp/s?k=${encodeURIComponent(book.title)}`, '_blank')} className="px-5 py-2.5 bg-[#FF9900] text-white text-xs font-black rounded-full shadow-sm">Amazon</button>
                  <button onClick={() => window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(book.title)}+書評`, '_blank')} className="px-5 py-2.5 bg-[#FF0000] text-white text-xs font-black rounded-full shadow-sm">YouTube</button>
                </div>
              </div>
              <div>
                <button onClick={() => setExpandedId(expandedId === i ? null : i)} className="text-amber-600 font-black text-sm flex items-center gap-2 p-2 bg-amber-50 rounded-lg">
                  {expandedId === i ? "▲ 詳細を閉じる" : "▼ AI司書の推薦理由を見る"}
                </button>
                {expandedId === i && (
                  <div className="mt-4 p-6 bg-slate-50 rounded-2xl border-l-8 border-amber-500 text-slate-700 leading-relaxed font-bold animate-fadeIn">
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