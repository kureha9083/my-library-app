'use client';

import { useState, useEffect } from 'react';

export default function Home() {
  const [input, setInput] = useState('');
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchMode, setSearchMode] = useState('general');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.log("位置情報スキップ:", err.message)
      );
    }
  }, []);

  const searchNearby = (keyword: string) => {
    const query = encodeURIComponent(keyword);
    const url = coords 
      ? `https://www.google.com/maps/search/${query}/@${coords.lat},${coords.lng},15z`
      : `https://www.google.com/maps/search/${query}+現在地`;
    window.open(url, '_blank');
  };

  const searchAmazon = (title: string) => {
    window.open(`https://www.amazon.co.jp/s?k=${encodeURIComponent(title)}`, '_blank');
  };

  const searchYouTube = (title: string) => {
    window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(title)}+レビュー+評価`, '_blank');
  };

  // ==========================================
  // ★ ここをご指摘通り大幅に修正しました ★
  // ==========================================
  const askAI = async () => {
    setLoading(true);
    setError('');
    setProposals([]);
    setExpandedId(null);

    try {
      // 1. ユーザーの入力に対して、page.tsx側からAIへ「絶対にJSONで、短く返せ」と直接命令を上書きする
      const strictInput = `
        キーワード: ${input}
        
        上記のキーワードに関するおすすめの本を5冊提案してください。
        【絶対ルール】
        1. 挨拶や解説文は一切書かないでください。
        2. 必ず以下のJSON配列の形式「のみ」を出力してください。
        3. reason（推薦理由）は絶対に【60文字〜80文字】で簡潔に書いてください。
        
        [
          {"title": "タイトル", "author": "著者", "reason": "60〜80文字の理由"}
        ]
      `;

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: strictInput, mode: searchMode }),
      });

      if (!res.ok) throw new Error("通信エラー");
      const data = await res.json();
      const text = data.text || "";

      // 2. AIが長文を混ぜてきても、[ ] の中身（データ部分）だけを強制的に抽出する
      const startIndex = text.indexOf('[');
      const endIndex = text.lastIndexOf(']');
      
      if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
        const jsonString = text.substring(startIndex, endIndex + 1);
        const parsed = JSON.parse(jsonString);
        setProposals(parsed);
      } else {
        throw new Error("JSON抽出失敗");
      }
    } catch (err: any) {
      console.error("解析エラー:", err);
      // 3. 万が一失敗した場合でも、長文の解説は表示せず、綺麗なエラー表示にする
      setProposals([{ 
        title: "うまく本を抽出できませんでした", 
        author: "AI司書", 
        reason: "AIが本のリストを作成できませんでした。「英検準一級の単語帳」や「おすすめの小説」など、少し言葉を足して再度お試しください。" 
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

        <div className="flex justify-center gap-4 mb-2">
          <button onClick={() => setSearchMode('general')} className={`px-8 py-3 rounded-2xl font-black transition-all ${ searchMode === 'general' ? 'bg-amber-500 text-white shadow-lg scale-105' : 'bg-white text-slate-400' }`}>
            🕯️ 一般文芸・話題作
          </button>
          <button onClick={() => setSearchMode('study')} className={`px-8 py-3 rounded-2xl font-black transition-all ${ searchMode === 'study' ? 'bg-indigo-600 text-white shadow-lg scale-105' : 'bg-white text-slate-400' }`}>
            🎓 学習・資格・専門書
          </button>
        </div>

        <section className="bg-white rounded-[2.5rem] shadow-2xl p-6 md:p-10 border-b-[12px] border-slate-200 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-600"></div>
          <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
            {searchMode === 'study' ? <><span className="p-2 bg-indigo-100 rounded-lg text-indigo-600">🎓</span> 専門書・学習参考書の検索</> : <><span className="p-2 bg-amber-100 rounded-lg text-amber-600">🖋️</span> 司書に希望を伝える</>}
          </h2>
          <div className="space-y-4">
            <textarea className="w-full bg-slate-50 border-2 border-slate-100 rounded-3xl p-6 text-lg font-bold focus:outline-none focus:border-amber-500 focus:bg-white transition-all h-40 shadow-inner" value={input} onChange={(e) => setInput(e.target.value)} placeholder="検索キーワードを入力してください" />
            <div className="flex justify-between items-center px-2">
              <p className="text-xs text-slate-400 font-medium italic">※AIが膨大なデータベースから最適な5冊を選定します</p>
              <button onClick={askAI} disabled={loading || !input} className="bg-slate-900 hover:bg-black text-white font-black py-4 px-12 rounded-2xl transition-all disabled:opacity-30 shadow-xl active:scale-95">
                {loading ? "蔵書を検索中..." : "この条件で提案を受ける"}
              </button>
            </div>
          </div>
        </section>

        {error && <div className="bg-red-500 text-white p-4 rounded-2xl font-bold text-center animate-bounce">{error}</div>}

        <div className="grid gap-4">
          {proposals.map((book, i) => (
            <div key={i} className="bg-white rounded-3xl p-6 shadow-md border border-slate-100 flex flex-col gap-4 transition-all hover:shadow-xl">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-black text-slate-800 mb-1">{book.title || "タイトル不明"}</h3>
                  <p className="text-slate-500 font-bold">著者: {book.author || "著者不明"}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => searchAmazon(book.title)} className="px-4 py-2 bg-[#FF9900] text-white text-xs font-black rounded-full shadow-sm hover:brightness-110">Amazonで探す</button>
                  <button onClick={() => searchYouTube(book.title)} className="px-4 py-2 bg-[#FF0000] text-white text-xs font-black rounded-full shadow-sm hover:brightness-110">YouTube評価</button>
                </div>
              </div>
              <div>
                <button onClick={() => setExpandedId(expandedId === i ? null : i)} className="text-amber-600 font-black text-sm flex items-center gap-1 hover:underline">
                  {expandedId === i ? "▲ 詳細を閉じる" : "▼ AI司書の推薦理由を見る"}
                </button>
                {expandedId === i && (
                  <div className="mt-4 p-5 bg-slate-50 rounded-2xl border-l-4 border-amber-500 text-slate-700 leading-relaxed font-medium animate-fadeIn whitespace-pre-wrap">
                    {book.reason || "理由がありません。"}
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