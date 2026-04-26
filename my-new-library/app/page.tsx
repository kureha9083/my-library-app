'use client';

import { useState, useEffect } from 'react';

export default function Home() {
  // ==========================================
  // 1. 状態管理（State）
  // ==========================================
  const [input, setInput] = useState('');
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchMode, setSearchMode] = useState('general');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null); // 詳細表示用
  const [error, setError] = useState('');

  // ==========================================
  // 2. 初期化・位置情報取得
  // ==========================================
  useEffect(() => {
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.log("位置情報取得スキップ:", err.message)
      );
    }
  }, []);

  // ==========================================
  // 3. 外部連携・検索ロジック
  // ==========================================
  
  // マップ検索（URLの破損を修正）
  const searchNearby = (keyword: string) => {
    const query = encodeURIComponent(keyword);
    const url = coords 
      ? `https://www.google.com/maps/search/${query}/@${coords.lat},${coords.lng},15z`
      : `https://www.google.com/maps/search/${query}+現在地`;
    window.open(url, '_blank');
  };

  // Amazon検索
  const searchAmazon = (title: string) => {
    window.open(`https://www.amazon.co.jp/s?k=${encodeURIComponent(title)}`, '_blank');
  };

  // YouTube検索（評価・レビュー確認用）
  const searchYouTube = (title: string) => {
    window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(title)}+レビュー+評価`, '_blank');
  };

  // ==========================================
  // 4. AI相談ロジック（より堅牢なパース処理へアップデート）
  // ==========================================
  const askAI = async () => {
    setLoading(true);
    setError('');
    setProposals([]);
    setExpandedId(null);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: input, mode: searchMode }),
      });

      if (!res.ok) throw new Error("通信に失敗しました");
      const data = await res.json();
      const text = data.text || "";

      // JSON抽出処理（正規表現で配列部分のみを確実に取り出すよう強化）
      try {
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          setProposals(parsed);
        } else {
          throw new Error("JSON形式が見つかりません");
        }
      } catch (parseError) {
        // パース失敗時のフォールバック処理
        console.error("JSONパースエラー:", parseError);
        setProposals([{ 
          title: "提案の形式を整えられませんでした", 
          author: "AI司書", 
          reason: `以下のテキストを参考にしてください:\n\n${text}` 
        }]);
      }
    } catch (err: any) {
      setError("申し訳ありません。検索中にエラーが発生しました。");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // 5. 画面表示（UI）
  // ==========================================
  return (
    <main className="min-h-screen bg-[#f1f5f9] p-4 md:p-8 text-slate-800 flex flex-col items-center font-sans">
      <div className="w-full max-w-5xl flex flex-col gap-6">

        {/* --- ヘッダー --- */}
        <header className="text-center py-6">
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter mb-2">
            MOMIJI <span className="text-xl font-light text-amber-600 italic">AI Library Service</span>
          </h1>
          <p className="text-slate-500 font-bold">プロが選ぶ「今、読むべき一冊」を瞬時に提案</p>
        </header>

        {/* --- 広告枠（上部） --- */}
        <div className="w-full bg-white border border-slate-200 rounded-xl p-4 text-center shadow-sm">
          <span className="text-[10px] text-slate-400 block mb-1">SPONSORED</span>
          <div className="h-20 flex items-center justify-center bg-slate-50 rounded border-2 border-dashed border-slate-200">
            <p className="text-slate-400 text-sm">ここに広告が表示されます（Amazonアソシエイトなど）</p>
          </div>
        </div>

        {/* --- モード切替 --- */}
        <div className="flex justify-center gap-4 mb-2">
          <button
            onClick={() => setSearchMode('general')}
            className={`px-8 py-3 rounded-2xl font-black transition-all ${
              searchMode === 'general' ? 'bg-amber-500 text-white shadow-lg scale-105' : 'bg-white text-slate-400'
            }`}
          >
            🕯️ 一般文芸・話題作
          </button>
          <button
            onClick={() => setSearchMode('study')}
            className={`px-8 py-3 rounded-2xl font-black transition-all ${
              searchMode === 'study' ? 'bg-indigo-600 text-white shadow-lg scale-105' : 'bg-white text-slate-400'
            }`}
          >
            🎓 学習・資格・専門書
          </button>
        </div>

        {/* --- メイン検索パネル --- */}
        <section className="bg-white rounded-[2.5rem] shadow-2xl p-6 md:p-10 border-b-[12px] border-slate-200 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-600"></div>
          
          <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
            {searchMode === 'study' ? (
              <><span className="p-2 bg-indigo-100 rounded-lg text-indigo-600">🎓</span> 専門書・学習参考書の検索</>
            ) : (
              <><span className="p-2 bg-amber-100 rounded-lg text-amber-600">🖋️</span> 司書に希望を伝える</>
            )}
          </h2>

          <div className="space-y-4">
            <textarea
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-3xl p-6 text-lg font-bold focus:outline-none focus:border-amber-500 focus:bg-white transition-all h-40 shadow-inner"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                searchMode === 'study' 
                  ? "例：TOEIC 800点を目指すための単語帳や、初心者向けの分かりやすい簿記3級のテキストを探しています。図解が多いものが希望です。" 
                  : "例：最近仕事で疲れているので、心が温まるような短編小説や、SNSで話題のミステリーを5冊教えてください。"
              }
            />
            <div className="flex justify-between items-center px-2">
              <p className="text-xs text-slate-400 font-medium italic">※AIが膨大なデータベースから最適な5冊を選定します</p>
              <button
                onClick={askAI}
                disabled={loading || !input}
                className="bg-slate-900 hover:bg-black text-white font-black py-4 px-12 rounded-2xl transition-all disabled:opacity-30 shadow-xl active:scale-95"
              >
                {loading ? "蔵書を検索中..." : "この条件で提案を受ける"}
              </button>
            </div>
          </div>
        </section>

        {/* --- マップ検索ツール --- */}
        <div className="grid grid-cols-3 gap-3">
          <button onClick={() => searchNearby("本屋")} className="bg-white p-4 rounded-2xl border-2 border-slate-100 hover:border-green-400 transition-all font-black text-slate-600 flex flex-col items-center gap-1 shadow-sm">
            <span className="text-2xl">📚</span><span className="text-xs">近くの本屋</span>
          </button>
          <button onClick={() => searchNearby("カフェ")} className="bg-white p-4 rounded-2xl border-2 border-slate-100 hover:border-orange-400 transition-all font-black text-slate-600 flex flex-col items-center gap-1 shadow-sm">
            <span className="text-2xl">☕</span><span className="text-xs">近くのカフェ</span>
          </button>
          <button onClick={() => searchNearby("図書館")} className="bg-white p-4 rounded-2xl border-2 border-slate-100 hover:border-blue-400 transition-all font-black text-slate-600 flex flex-col items-center gap-1 shadow-sm">
            <span className="text-2xl">📖</span><span className="text-xs">近くの図書館</span>
          </button>
        </div>

        {/* --- エラー表示 --- */}
        {error && <div className="bg-red-500 text-white p-4 rounded-2xl font-bold text-center animate-bounce">{error}</div>}

        {/* --- 提案結果グリッド --- */}
        <div className="grid gap-4">
          {proposals.map((book, i) => (
            <div key={i} className="bg-white rounded-3xl p-6 shadow-md border border-slate-100 flex flex-col gap-4 transition-all hover:shadow-xl">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-black text-slate-800 mb-1">{book.title || "タイトル不明"}</h3>
                  <p className="text-slate-500 font-bold">著者: {book.author || "著者不明"}</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => searchAmazon(book.title)}
                    className="px-4 py-2 bg-[#FF9900] text-white text-xs font-black rounded-full shadow-sm hover:brightness-110"
                  >
                    Amazonで探す
                  </button>
                  <button 
                    onClick={() => searchYouTube(book.title)}
                    className="px-4 py-2 bg-[#FF0000] text-white text-xs font-black rounded-full shadow-sm hover:brightness-110"
                  >
                    YouTube評価
                  </button>
                </div>
              </div>

              {/* 詳細表示トグル */}
              <div>
                <button 
                  onClick={() => setExpandedId(expandedId === i ? null : i)}
                  className="text-amber-600 font-black text-sm flex items-center gap-1 hover:underline"
                >
                  {expandedId === i ? "▲ 詳細を閉じる" : "▼ AI司書の推薦理由を見る"}
                </button>
                
                {/* 修正ポイント： whitespace-pre-wrap を追加して改行を正しく表示 */}
                {expandedId === i && (
                  <div className="mt-4 p-5 bg-slate-50 rounded-2xl border-l-4 border-amber-500 text-slate-700 leading-relaxed font-medium animate-fadeIn whitespace-pre-wrap">
                    {book.reason || "推薦理由が提供されていません。"}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* --- 広告枠（下部） --- */}
        <div className="w-full bg-white border border-slate-200 rounded-xl p-4 text-center shadow-sm mt-8">
          <span className="text-[10px] text-slate-400 block mb-1">ADVERTISEMENT</span>
          <div className="h-32 flex items-center justify-center bg-slate-50 rounded border-2 border-dashed border-slate-200">
            <p className="text-slate-400 text-sm font-bold">ここにバナー広告などを掲載できます</p>
          </div>
        </div>

      </div>
      
      <footer className="mt-20 pb-10 text-slate-400 text-xs font-bold">
        © 2024 MOMIJI AI Library Service. All rights reserved.
      </footer>
    </main>
  );
}