'use client';

import { useState, useEffect } from 'react';

export default function Home() {
  // ==========================================
  // 1. 状態管理（データの保存場所）
  // ==========================================
  const [input, setInput] = useState('');
  const [proposals, setProposals] = useState<any[]>([]);
  const [rawTextFallback, setRawTextFallback] = useState(''); // AIが普通の文章で返してきた時用の表示枠
  const [loading, setLoading] = useState(false);
  const [searchMode, setSearchMode] = useState('general');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [errorMessage, setErrorMessage] = useState(''); // エラー時のメッセージ表示用

  // ==========================================
  // 2. 現在地の自動取得
  // ==========================================
  useEffect(() => {
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoords({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.warn("位置情報の取得スキップ（手動検索を利用します）:", error.message);
        }
      );
    }
  }, []);

  // ==========================================
  // 3. マップ検索機能
  // ==========================================
  const searchNearby = (keyword: string) => {
    let url = "";
    if (coords) {
      url = `https://www.google.com/maps/search/$${keyword}/@${coords.lat},${coords.lng},15z`;
    } else {
      url = `https://www.google.com/maps/search/$${keyword}+現在地`;
    }
    window.open(url, '_blank');
  };

  // ==========================================
  // 4. 入力欄のプレースホルダー（薄い文字）切り替え
  // ==========================================
  const getPlaceholder = () => {
    if (searchMode === 'study') {
      return "例：TOEIC 800点を目指すための単語帳や、初心者向けの分かりやすい簿記3級のテキストを探しています...";
    }
    return "いまの気分や、最近面白かった本、次に読んでみたい本のイメージを教えてください...";
  };

  // ==========================================
  // 5. AIへの相談機能（絶対に結果を表示する堅牢な処理）
  // ==========================================
  const askAI = async () => {
    setLoading(true);
    setProposals([]);
    setRawTextFallback('');
    setErrorMessage('');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: input, mode: searchMode }),
      });

      if (!res.ok) {
        throw new Error(`サーバーエラーが発生しました (${res.status})`);
      }

      const data = await res.json();
      
      // APIの構造がどうであれ、テキストを何としてでも抽出する
      const text = data.text || data.response || data.message || data.answer || "";

      if (!text) {
        throw new Error("AIからの返答が空でした。もう一度お試しください。");
      }

      // JSON配列として綺麗に解析できるか挑戦する
      try {
        let cleanText = text.replace(/```json/gi, "").replace(/```/g, "").trim();
        const startIndex = cleanText.indexOf('[');
        const endIndex = cleanText.lastIndexOf(']');
        
        if (startIndex !== -1 && endIndex !== -1) {
          cleanText = cleanText.substring(startIndex, endIndex + 1);
          cleanText = cleanText.replace(/,\s*\]/g, ']').replace(/,\s*\}/g, '}'); // 余分なカンマ除去
          const parsedData = JSON.parse(cleanText);
          
          if (Array.isArray(parsedData) && parsedData.length > 0) {
            setProposals(parsedData); // 成功：カード型で表示
            return;
          }
        }
        // JSONじゃない、または抽出失敗した場合は普通のテキストとして全表示する（何も出ないバグを防ぐ）
        setRawTextFallback(text);
      } catch (e) {
        // 解析中にエラーが起きても、絶対に抽出したテキストは表示させる
        setRawTextFallback(text);
      }

    } catch (error: any) {
      console.error("AI相談エラー:", error);
      setErrorMessage(error.message || "通信エラーが発生しました。時間をおいて再度お試しください。");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // 6. UIの描画
  // ==========================================
  return (
    <main className="min-h-screen bg-[#f8fafc] p-4 md:p-8 text-slate-800 flex flex-col items-center">
      <div className="w-full max-w-4xl flex flex-col gap-8">

        {/* ---------------- タイトル ---------------- */}
        <div className="text-center pt-8 pb-2">
          <h1 className="text-4xl font-extrabold text-slate-800 flex items-center justify-center gap-2">
            MOMIJI <span className="text-sm block font-normal">〜 AI 図書館 〜</span>
          </h1>
          <p className="text-lg text-slate-600 font-bold mt-2">
            定番からSNSの話題書まで、あなたに最適な「知」を提案します。
          </p>
        </div>

        {/* ---------------- タブ切り替え ---------------- */}
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setSearchMode('general')}
            className={`px-6 py-2 rounded-full font-bold transition-all ${
              searchMode === 'general' ? 'bg-white shadow-md text-amber-600' : 'text-slate-500 hover:bg-slate-200'
            }`}
          >
            🕯️ 一般相談
          </button>
          <button
            onClick={() => setSearchMode('study')}
            className={`px-6 py-2 rounded-full font-bold transition-all ${
              searchMode === 'study' ? 'bg-white shadow-md text-indigo-600' : 'text-slate-500 hover:bg-slate-200'
            }`}
          >
            🎓 学習・資格
          </button>
        </div>

        {/* ---------------- 相談パネル ---------------- */}
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
              placeholder={getPlaceholder()}
            />
            <div className="flex justify-end">
              <button
                onClick={askAI}
                disabled={loading || !input}
                className="bg-[#d97706] hover:bg-[#b45309] text-white font-bold py-3 px-8 rounded-xl transition-all disabled:opacity-50 shadow-md"
              >
                {loading ? "蔵書から探しています..." : "定番・話題の5冊を探す"}
              </button>
            </div>
          </div>
        </section>

        {/* ---------------- マップ検索ボタン ---------------- */}
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

        {/* ---------------- エラーメッセージ表示 ---------------- */}
        {errorMessage && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl mt-4">
            <p className="text-red-700 font-bold">⚠️ エラー</p>
            <p className="text-red-600">{errorMessage}</p>
          </div>
        )}

        {/* ---------------- 結果表示（カード型） ---------------- */}
        {proposals && proposals.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 mt-4">
            {proposals.map((book: any, i: number) => (
              <div key={i} className="bg-white p-6 rounded-2xl shadow-md border-l-4 border-amber-500 hover:shadow-lg transition-all">
                <h3 className="font-bold text-xl mb-2 text-slate-800">{book.title}</h3>
                <p className="text-sm text-slate-500 mb-3 font-medium">著者: {book.author}</p>
                <p className="text-slate-700 leading-relaxed">{book.reason}</p>
              </div>
            ))}
          </div>
        )}

        {/* ---------------- 結果表示（テキスト型：カードで出せなかった時の救済） ---------------- */}
        {rawTextFallback && proposals.length === 0 && (
          <div className="bg-white p-8 rounded-3xl shadow-lg border-t-8 border-amber-500 mt-4">
            <h3 className="font-bold text-xl mb-4 text-slate-800 flex items-center gap-2">
              <span className="text-amber-500">📚</span> 司書からの提案
            </h3>
            <div className="text-slate-700 leading-relaxed whitespace-pre-wrap">
              {rawTextFallback}
            </div>
          </div>
        )}

      </div>
    </main>
  );
}