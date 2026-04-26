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
    try {
      const res = await fetch('/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: input }),
      });
      const data = await res.json();
      const parsed = JSON.parse(data.text);
      setProposals(Array.isArray(parsed) ? parsed : []);
    } catch (err) {
      setProposals([{ title: "エラー", author: "再試行", reason: "通信に失敗しました。" }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f1f5f9] p-4 md:p-8 flex flex-col items-center">
      <div className="w-full max-w-5xl flex flex-col gap-6">
        <header className="text-center py-8">
          <h1 className="text-6xl font-black text-slate-900 italic">MOMIJI</h1>
          <p className="text-slate-500 font-bold">AI Library Service</p>
        </header>

        {/* 周辺検索 */}
        <div className="grid grid-cols-3 gap-4 mb-2">
          {['本屋', 'ブックカフェ', '図書館'].map((label, i) => (
            <button key={i} onClick={() => searchNearby(label)} className="bg-white p-6 rounded-[2.5rem] shadow-sm border flex flex-col items-center gap-3 hover:scale-105 transition-all">
              <span className="text-4xl">{i===0?'📚':i===1?'☕':'📖'}</span>
              <span className="text-xs font-black text-slate-600">近くの{label}</span>
            </button>
          ))}
        </div>

        {/* モード切替 */}
        <div className="flex justify-center gap-4 mb-2">
          <button onClick={() => setSearchMode('general')} className={`px-12 py-4 rounded-[1.5rem] font-black ${searchMode==='general'?'bg-amber-500 text-white':'bg-white text-slate-500'}`}>🕯️ 一般文芸</button>
          <button onClick={() => setSearchMode('study')} className={`px-12 py-4 rounded-[1.5rem] font-black ${searchMode==='study'?'bg-indigo-600 text-white':'bg-white text-slate-500'}`}>🎓 学習・専門書</button>
        </div>

        {/* 入力エリア */}
        <section className="bg-white rounded-[3rem] shadow-2xl p-8 border-b-[16px] border-slate-200">
          <h2 className="text-3xl font-black mb-8">🖋️ {searchMode === 'study' ? '専門書検索' : '希望を伝える'}</h2>
          <textarea 
            className="w-full bg-slate-50 border-4 rounded-[2rem] p-8 text-xl font-bold h-56 focus:border-amber-500 outline-none"
            value={input} onChange={(e) => setInput(e.target.value)}
            placeholder="探している本を教えてください..."
          />
          <div className="flex justify-end mt-6">
            <button onClick={askAI} disabled={loading || !input} className="bg-slate-900 text-white font-black py-6 px-20 rounded-[2rem] shadow-2xl disabled:opacity-20">
              {loading ? "蔵書検索中..." : "提案を受ける"}
            </button>
          </div>
        </section>

        {/* 提案表示 */}
        <div className="grid gap-8">
          {proposals.map((book, i) => (
            <div key={i} className="bg-white rounded-[2.5rem] p-8 shadow-xl border flex flex-col gap-6 animate-fadeIn">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-3xl font-black text-slate-800">{book.title}</h3>
                  <p className="text-slate-400 font-black text-xl">著者: {book.author}</p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => window.open(`https://www.amazon.co.jp/s?k=${encodeURIComponent(book.title)}`)} className="px-8 py-4 bg-[#FF9900] text-white font-black rounded-2xl">Amazon</button>
                  <button onClick={() => window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(book.title)}`)} className="px-8 py-4 bg-[#FF0000] text-white font-black rounded-2xl">YouTube</button>
                </div>
              </div>
              <button onClick={() => setExpandedId(expandedId === i ? null : i)} className="text-slate-500 font-black text-sm text-left">
                {expandedId === i ? "▲ 閉じる" : "▼ 推薦理由を見る"}
              </button>
              {expandedId === i && <div className="p-8 bg-slate-50 rounded-[2rem] border-l-[12px] border-amber-500 text-lg font-bold italic">「{book.reason}」</div>}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}