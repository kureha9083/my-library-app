'use client';

import { useState, useEffect } from 'react';

export default function Home() {
  // ==========================================
  // 1. 状態管理（データの保存場所）
  // ==========================================
  const [input, setInput] = useState('');
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchMode, setSearchMode] = useState('general');
  // ユーザーの現在地（緯度・経度）を保存する場所
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  // ==========================================
  // 2. 現在地の自動取得（ページを開いた時に実行）
  // ==========================================
  useEffect(() => {
    // ブラウザが位置情報に対応しているか確認
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // 取得成功：緯度と経度をセット
          setCoords({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("位置情報の取得に失敗しました（許可されていない等）:", error);
        }
      );
    }
  }, []);

  // ==========================================
  // 3. マップ検索機能（本屋・カフェ・図書館）
  // ==========================================
  const searchNearby = (keyword: string) => {
    let url = "";
    if (coords) {
      // 緯度・経度が取得できている場合は、その地点を中心に検索（より正確）
      url = `https://www.google.com/maps/search/${keyword}/@${coords.lat},${coords.lng},15z`;
    } else {
      // 取得できていない場合はキーワード検索で代用
      url = `https://www.google.com/maps/search/${keyword}+現在地`;
    }
    window.open(url, '_blank');
  };

  // ==========================================
  // 4. AIへの相談機能（Gemini APIとの通信）
  // ==========================================
  const askAI = async () => {
    setLoading(true);
    setProposals([]); // 前の結果をクリア
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: input, mode: searchMode }),
      });
      const data = await res.json();
      
      // AIの返答（テキスト）を取得
      const text = data.text || data.error || "";

      // JSON形式のデータを安全に取り出すための処理
      let cleanText = text.replace(/```json/gi, "").replace(/```/g, "").trim();
      const startIndex = cleanText.indexOf('[');
      const endIndex = cleanText.lastIndexOf(']');
      
      if (startIndex !== -1 && endIndex !== -1) {
        cleanText = cleanText.substring(startIndex, endIndex + 1);
        // 余分なカンマなどを取り除く安全策
        cleanText = cleanText.replace(/,\s*\]/g, ']').replace(/,\s*\}/g, '}');
        
        const parsedData = JSON.parse(cleanText);
        if (Array.isArray(parsedData) && parsedData.length > 0) {
          setProposals(parsedData);
        } else {
          console.error("AIからの提案が空です。");
        }
      } else {
        console.error("AIの返答からデータ形式を見つけられませんでした。");
      }
    } catch (error) {
      console.error("AI相談中にエラーが発生しました:", error);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // 5. 画面の表示（UI）
  // ==========================================
  return (
    <main className="min-h-screen bg-[#f8fafc] p-4 md:p-8 text-slate-800 flex flex-col items-center">
      <div className="w-full max-w-4xl flex flex-col gap-8">

        {/* ----------------- ヘッダー部分 ----------------- */}
        <div className="text-center pt-8 pb-2">
          <h1 className="text-4xl font-extrabold text-slate-800 flex items-center justify-center gap-2">
            MOMIJI <span className="text-sm block font-normal">〜 AI 図書館 〜</span>
          </h1>
          <p className="text-lg text-slate-600 font-bold mt-2">
            定番からSNSの話題書まで、あなたに最適な「知」を提案します。
          </p>
        </div>

        {/* ----------------- モード切替タブ ----------------- */}
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setSearchMode('general')}
            className={`px-6 py-2 rounded-full font-bold transition-all ${
              searchMode === 'general' ? 'bg-white shadow-md text-amber-600' : 'text-slate-500'
            }`}
          >
            🕯️ 一般相談
          </button>
          <button
            onClick={() => setSearchMode('study')}
            className={`px-6 py-2 rounded-full font-bold transition-all ${
              searchMode === 'study' ? 'bg-white shadow-md text-indigo-600' : 'text-slate-500'
            }`}
          >
            🎓 学習・資格
          </button>
        </div>

        {/* ----------------- 相談パネル（白い枠） ----------------- */}
        <section className="bg-white shadow-xl rounded-3xl p-8 border-t-8 border-amber-500 transition-all">
          <h2 className="text-2xl font-extrabold text-slate-800 mb-6 flex items-center gap-2">
            {searchMode === 'study' ? (
              <><span className="text-indigo-500">🎓</span> 必要な参考書の条件を入力</>
            ) : (
              <><span className="text-amber-500">🖋️</span> 司書に相談する</>
            )}
          </h2>

          <div className="flex flex-col gap-4">
            <textarea
              className="w-full border-2 border-slate-100 rounded-2xl p-5 text-lg font-medium focus:outline-none focus:border-amber-400 transition-colors resize-none h-32"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="いまの気分や、読みたい本のイメージを教えてください..."
            />
            <div className="flex justify-end">
              <button
                onClick={askAI}
                disabled={loading || !input}
                className="bg-[#d97706] hover:bg-[#b45309] text-white font-bold py-3 px-8 rounded-xl transition-all disabled:opacity-50"
              >
                {loading ? "探しています..." : "定番・話題の5冊を探す"}
              </button>
            </div>
          </div>
        </section>

        {/* ----------------- 周辺検索ボタン（白枠の外側に配置） ----------------- */}
        <div className="flex flex-wrap gap-4 justify-center mt-2">
          <button
            onClick={() => searchNearby("本屋")}
            className="flex-1 min-w-[140px] max-w-[250px] bg-white border-2 border-slate-200 hover:border-green-400 p-4 rounded-xl transition-all flex items-center justify-center gap-2 text-slate-600 font-bold shadow-sm"
          >
            📚 近くの本屋
          </button>
          <button
            onClick={() => searchNearby("カフェ")}
            className="flex-1 min-w-[140px] max-w-[250px] bg-white border-2 border-slate-200 hover:border-orange-300 p-4 rounded-xl transition-all flex items-center justify-center gap-2 text-slate-600 font-bold shadow-sm"
          >
            ☕ 近くのカフェ
          </button>
          <button
            onClick={() => searchNearby("図書館")}
            className="flex-1 min-w-[140px] max-w-[250px] bg-white border-2 border-slate-200 hover:border-blue-300 p-4 rounded-xl transition-all flex items-center justify-center gap-2 text-slate-600 font-bold shadow-sm"
          >
            📖 近くの図書館
          </button>
        </div>

        {/* ----------------- AIの提案結果表示エリア ----------------- */}
        {proposals && proposals.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 mt-4">
            {proposals.map((book: any, i: number) => (
              <div key={i} className="bg-white p-6 rounded-2xl shadow-md border-l-4 border-amber-500">
                <h3 className="font-bold text-xl mb-2">{book.title}</h3>
                <p className="text-sm text-slate-500 mb-2">著者: {book.author}</p>
                <p className="text-slate-700">{book.reason}</p>
              </div>
            ))}
          </div>
        )}

      </div>
    </main>
  );
}