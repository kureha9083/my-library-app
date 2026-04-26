"use client";
import { useState, useEffect, useRef } from "react";

type BookProposal = {
  title: string;
  short: string;
  detail: string;
};

// 広告の二重読み込みエラーを防止した安全なコンポーネント
const AdBanner = () => {
  const adRef = useRef<boolean>(false);

  useEffect(() => {
    if (!adRef.current) {
      try {
        const adsbygoogle = (window as any).adsbygoogle || [];
        adsbygoogle.push({});
        adRef.current = true;
      } catch (err) {
        console.error("AdSense error (Safe):", err);
      }
    }
  }, []);

  return (
    <div className="w-full text-center overflow-hidden flex flex-col items-center justify-center my-2 min-h-[110px]">
      <span className="text-gray-400 text-xs font-bold mb-2 tracking-wider">SPONSORED LINK</span>
      <ins className="adsbygoogle bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 text-sm font-bold"
           style={{ display: "block", width: "100%", maxWidth: "728px", height: "90px" }}
           data-ad-client="ca-pub-0000000000000000"
           data-ad-slot="0000000000"
           data-ad-format="auto"
           data-full-width-responsive="true">
        （ここにGoogle広告が自動表示されます）
      </ins>
    </div>
  );
};

export default function Home() {
  const [input, setInput] = useState("");
  const [proposals, setProposals] = useState<BookProposal[]>([]);
  const [expandedStates, setExpandedStates] = useState<{ [key: number]: boolean }>({});
  
  const [loading, setLoading] = useState(false);
  const [loadingTipIndex, setLoadingTipIndex] = useState(0);
  
  const [searchMode, setSearchMode] = useState<"general" | "study">("general");
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locError, setLocError] = useState("");
  const [favorites, setFavorites] = useState<{title: string, short: string}[]>([]);
  const [historyTitles, setHistoryTitles] = useState<string[]>([]);

  const loadingTips = [
    "AI司書が巨大な書庫を検索しています...",
    "YouTubeやSNSで絶賛されている話題の書をピックアップ中...",
    "Amazonレビューや定番の良書を精査しています...",
    "あなたに合うようバリエーションを調整中...",
    "まもなくご提案の準備が整います..."
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      interval = setInterval(() => {
        setLoadingTipIndex((prev) => (prev + 1) % loadingTips.length);
      }, 2500);
    } else {
      setLoadingTipIndex(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const askAI = async (isRetry = false) => {
    if (!input) return;
    setLoading(true);
    
    let currentHistory = historyTitles;
    if (!isRetry) {
      setProposals([]);
      setExpandedStates({});
      currentHistory = [];
      setHistoryTitles([]);
    } else {
      currentHistory = [...historyTitles, ...proposals.map(p => p.title)];
      setHistoryTitles(currentHistory);
      setProposals([]);
      setExpandedStates({});
    }
    
    const count = searchMode === "study" ? 6 : 5;
    
    const categoryPrompt = searchMode === "study" 
      ? "大学受験の参考書・問題集、または資格・検定の専門書。定番の良書や、YouTube・SNSで「神参考書」と絶賛されているものを優先してください。" 
      : "一般的な小説、ビジネス書、エッセイなど。定番書だけでなく、SNS等で話題の本も含めてください。";

    const excludePrompt = currentHistory.length > 0 
      ? `\n※注意: 以下の本は既に提案済みです。別の本を提案してください。\n[除外リスト: ${currentHistory.join(", ")}]` 
      : "";

  const instruction = `以下の相談に対し、おすすめの本を「${count}冊」提案してください。
${categoryPrompt}

【重要条件】
1. 王道の基本書やSNSで話題の本など、バリエーションを持たせてください。
2. ユーザーの相談に「特定の本の名前」や「こだわりのキーワード」がある場合は、可能な限りそれを含めてください。ただし、見つからない場合や文脈に合わない場合は、無理に入れず最適な代替案を出してください。
3. 【厳守】プログラムで読み込むため、出力は「必ず以下の形式のJSON配列のみ」にしてください。挨拶や言い訳などの文章は絶対に含めないでください。${excludePrompt}

[
  {
    "title": "本のタイトルと著者名",
    "short": "30文字程度の推薦理由",
    "detail": "特徴やSNSでの評価（最大3文程度で簡潔に）"
  }
]

相談内容:
${input}`;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: instruction }),
      });
      
      if (!res.ok) {
        throw new Error(`サーバーからの応答がありませんでした。(ステータスコード: ${res.status})`);
      }

      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("text/html")) {
        throw new Error("APIが想定外の応答（HTML）を返しました。タイムアウトの可能性があります。");
      }

      const data = await res.json();
      const text = data.text || data.error || "";

      let cleanText = text.replace(/```json/gi, "").replace(/```/g, "").trim();
      
      const startIndex = cleanText.indexOf('[');
      const endIndex = cleanText.lastIndexOf(']');

      if (startIndex !== -1 && endIndex !== -1) {
        cleanText = cleanText.substring(startIndex, endIndex + 1);
        cleanText = cleanText.replace(/,\s*\]/g, ']').replace(/,\s*\}/g, '}');

        try {
          const parsedData = JSON.parse(cleanText);
          if (Array.isArray(parsedData) && parsedData.length > 0) {
            setProposals(parsedData);
          } else {
            throw new Error("配列が空、または形式が異なります。");
          }
        } catch (parseError) {
          console.error("JSON Parse Error:", parseError, "Raw Data:", cleanText);
          setProposals([{ 
            title: "データの整理に失敗しました", 
            short: "AIの出力形式に乱れがありました。", 
            detail: "お手数ですが、もう一度「検索」または「再検索」をお試しください。" 
          }]);
        }
      } else {
        throw new Error("JSONデータが見つかりませんでした。");
      }

    } catch (e: any) {
      console.error("Fetch/Timeout Error:", e);
      setProposals([{ 
        title: "通信エラーが発生しました", 
        short: "サーバーが混み合っているか、タイムアウトしました。", 
        detail: `【エラー詳細】\n${e.message}\n\nAIの考える時間が長すぎた可能性があります。少し時間をおくか、提案数を減らすよう裏側で調整が必要かもしれません。` 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const toggleDetail = (index: number) => {
    setExpandedStates(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const getLocation = () => {
    setLocError("");
    if (!navigator.geolocation) {
      setLocError("位置情報は対応していません。");
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setLocError("位置情報の取得に失敗しました。スマホの設定で許可されているか確認してください。");
        setLoading(false);
      },
      { timeout: 10000 }
    );
  };

  const addFavorite = (book: BookProposal) => {
    if (!favorites.some(f => f.title === book.title)) {
      setFavorites([...favorites, { title: book.title, short: book.short }]);
    }
  };

  return (
    <main className="min-h-screen bg-[#f8fafc] p-4 md:p-8 text-slate-800 flex flex-col items-center font-sans">
      <div className="w-full max-w-4xl flex flex-col gap-8">
        
        <div className="text-center pt-8 pb-2">
  <h1 className="text-4xl font-extrabold text-slate-800 flex items-center justify-center gap-2">
    MOMIJI <span className="text-sm block font-normal">〜 AI 図書館 〜</span>
  </h1>
  <p className="text-lg text-slate-600 font-bold">
    定番からSNSの話題書まで、あなたに最適な「知」を提案します。
  </p>
</div>

        <AdBanner />

        <div className="flex justify-center gap-2 p-1 bg-slate-200 rounded-2xl w-fit mx-auto shadow-inner">
          <button 
            onClick={() => {setSearchMode("general"); setInput(""); setProposals([]); setHistoryTitles([]);}}
            className={`px-8 py-3 rounded-xl font-bold transition-all ${searchMode === 'general' ? 'bg-white text-amber-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
          >
            🕯️ 一般相談
          </button>
          <button 
            onClick={() => {setSearchMode("study"); setInput(""); setProposals([]); setHistoryTitles([]);}}
            className={`px-8 py-3 rounded-xl font-bold transition-all ${searchMode === 'study' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
          >
            🎓 学習・資格
          </button>
        </div>
        
        <section className={`bg-white shadow-xl rounded-3xl p-8 border-t-8 transition-colors ${searchMode === 'study' ? 'border-indigo-500' : 'border-amber-500'}`}>
          <h2 className="text-2xl font-extrabold text-slate-800 mb-6 flex items-center gap-3">
            {searchMode === 'study' ? (
              <><span className="text-indigo-500">✍️</span> 必要な参考書の条件を入力</>
            ) : (
              <><span className="text-amber-500">🖋️</span> 司書に相談する</>
            )}
          </h2>

          <div className="flex flex-col gap-4">
            {searchMode === 'study' ? (
              <textarea 
                className="w-full border-2 border-slate-100 rounded-2xl p-5 text-lg font-medium text-slate-800 focus:outline-none focus:border-indigo-500 bg-slate-50 placeholder-slate-400 transition-all min-h-[180px]"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={"例：\n・ターゲット：大学受験（MARCHレベル）\n・科目：英語長文\n・こだわり：YouTubeで評判が良いもの、解説が丁寧なもの"}
              />
            ) : (
              <input 
                className="w-full border-2 border-slate-100 rounded-2xl p-5 text-lg font-medium text-slate-800 focus:outline-none focus:border-amber-500 bg-slate-50 transition-all"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && askAI(false)}
                placeholder="いまの気分や、読みたい本のイメージを教えてください..."
              />
            )}
            
            <button 
              onClick={() => askAI(false)} 
              disabled={loading}
              className={`relative overflow-hidden w-full md:w-fit self-end font-extrabold py-4 px-12 rounded-2xl transition-all disabled:opacity-80 shadow-lg text-lg text-white ${searchMode === 'study' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-amber-600 hover:bg-amber-700'}`}
            >
              {loading ? (
                <span className="flex items-center gap-2 animate-pulse">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  検索しています...
                </span>
              ) : (
                searchMode === 'study' ? "定番・話題の6冊を探す" : "定番・話題の5冊を探す"
              )}
            </button>
            
            {loading && (
              <p className="text-right text-sm font-bold text-slate-500 animate-fade-in mt-2">
                {loadingTips[loadingTipIndex]}
              </p>
            )}
          </div>
        </section>

        {proposals.length > 0 && (
          <section className="bg-white shadow-xl rounded-3xl p-8 border-l-8 border-slate-200 relative animate-fade-in">
            <h2 className="text-2xl font-extrabold text-slate-800 mb-8 flex items-center gap-3 border-b pb-4">
              <span className={searchMode === 'study' ? 'text-indigo-500' : 'text-amber-500'}>📚</span> 
              ユーザー評価の高い本を厳選
            </h2>
            
            <div className="flex flex-col gap-8">
              {proposals.map((book, index) => (
                <div key={index} className={`p-6 md:p-8 rounded-3xl border transition-all ${searchMode === 'study' ? 'bg-indigo-50/50 border-indigo-100 hover:border-indigo-300' : 'bg-amber-50/50 border-amber-100 hover:border-amber-300'}`}>
                  
                  <h3 className={`text-2xl font-extrabold mb-3 ${searchMode === 'study' ? 'text-indigo-900' : 'text-amber-900'}`}>
                    {book.title}
                  </h3>
                  <p className="text-lg text-slate-700 font-bold leading-relaxed mb-6">
                    {book.short}
                  </p>

                  <div className="flex flex-wrap gap-3">
                    <button 
                      onClick={() => toggleDetail(index)}
                      className="bg-white hover:bg-slate-50 text-slate-700 border-2 border-slate-200 font-bold py-2 px-6 rounded-xl transition-all text-sm shadow-sm"
                    >
                      {expandedStates[index] ? "▲ 閉じる" : "▼ 評価の理由を読む"}
                    </button>
                    <a 
                      href={`https://www.google.com/search?q=${encodeURIComponent(book.title)}`} 
                      target="_blank" rel="noopener noreferrer"
                      className="bg-white hover:bg-blue-50 text-blue-600 border-2 border-blue-200 font-bold py-2 px-6 rounded-xl transition-all text-sm shadow-sm"
                    >
                      🔍 検索
                    </a>
                    <a 
                      href={`https://www.youtube.com/results?search_query=${encodeURIComponent(book.title)}`} 
                      target="_blank" rel="noopener noreferrer"
                      className="bg-white hover:bg-red-50 text-red-600 border-2 border-red-200 font-bold py-2 px-6 rounded-xl transition-all text-sm shadow-sm"
                    >
                      ▶️ YouTube
                    </a>
                    <button 
                      onClick={() => addFavorite(book)}
                      className="ml-auto bg-slate-800 hover:bg-black text-white font-bold py-2 px-6 rounded-xl shadow-md transition-all hover:-translate-y-1 text-sm"
                    >
                      🔖 保存
                    </button>
                  </div>

                  {expandedStates[index] && (
                    <div className="mt-6 pt-6 border-t border-slate-200/50 animate-fade-in text-slate-800 leading-loose whitespace-pre-wrap font-medium">
                      {book.detail}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-10 flex justify-center border-t border-slate-100 pt-8">
              <button 
                onClick={() => askAI(true)} 
                disabled={loading}
                className="bg-white hover:bg-slate-100 text-slate-700 border-2 border-slate-300 font-extrabold py-4 px-10 rounded-full transition-all shadow-md flex items-center gap-3 text-lg disabled:opacity-50"
              >
                {loading ? "再検索中..." : "🔁 これら以外で別の候補を探す"}
              </button>
            </div>
          </section>
        )}

        <AdBanner />

        {favorites.length > 0 && (
          <section className="bg-white shadow-xl rounded-3xl p-8 border-t-8 border-rose-400">
            <h2 className="text-2xl font-extrabold text-slate-800 mb-6 flex items-center gap-3">
              <span className="text-rose-400">📋</span> 検討中のリスト
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {favorites.map((fav, index) => (
                <div key={index} className="p-5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col gap-4">
                  <div className="font-extrabold text-slate-900">{fav.title}</div>
                  <div className="flex gap-2">
                    <a href={`https://www.amazon.co.jp/s?k=${encodeURIComponent(fav.title)}`} target="_blank" className="text-xs bg-amber-100 text-amber-800 px-3 py-1.5 rounded-lg font-bold">Amazon</a>
                    <a href={`https://www.google.com/search?q=${encodeURIComponent(fav.title)}`} target="_blank" className="text-xs bg-blue-100 text-blue-800 px-3 py-1.5 rounded-lg font-bold">Web検索</a>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="bg-white shadow-xl rounded-3xl p-8 border-t-8 border-emerald-500 flex flex-col items-center">
          <h2 className="text-2xl font-extrabold text-slate-800 mb-6">📍 近くの図書館・書店を探す</h2>
          {locError && <p className="text-red-500 font-bold mb-4">{locError}</p>}
          <button onClick={getLocation} className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-4 px-10 rounded-2xl shadow-lg transition-all">現在地から探す</button>
          {location && (
            <div className="mt-8 flex gap-4 w-full">
              <a href={`https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lng}+図書館`} target="_blank" rel="noopener noreferrer" className="flex-1 bg-slate-100 p-4 rounded-xl text-center font-bold border-2 border-transparent hover:border-emerald-500 transition-all">🏛️ 図書館</a>
              <a href={`https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lng}+本屋`} target="_blank" rel="noopener noreferrer" className="flex-1 bg-slate-100 p-4 rounded-xl text-center font-bold border-2 border-transparent hover:border-emerald-500 transition-all">📚 本屋</a>
            </div>
          )}
        </section>

      </div>
    </main>
  );
}