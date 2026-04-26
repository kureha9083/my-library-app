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
    <main className="min-h-screen bg-[#f8fafc] p-4 md:p-8 text-slate-800 flex flex-col items-center">
      <div className="w-full max-w-4xl flex flex-col gap-8">

        {/* ① タイトル部分 */}
        <div className="text-center pt-8 pb-2">
          <h1 className="text-4xl font-extrabold text-slate-800 flex items-center justify-center gap-2">
            MOMIJI <span className="text-sm block font-normal">〜 AI 図書館 〜</span>
          </h1>
          <p className="text-lg text-slate-600 font-bold mt-2">
            定番からSNSの話題書まで、あなたに最適な「知」を提案します。
          </p>
        </div>

        {/* ② タブ切り替え */}
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setSearchMode('general')}
            className={`px-6 py-2 rounded-full font-bold transition-all ${searchMode === 'general' ? 'bg-white shadow-md text-amber-600' : 'text-slate-500'}`}
          >
            🕯️ 一般相談
          </button>
          <button
            onClick={() => setSearchMode('study')}
            className={`px-6 py-2 rounded-full font-bold transition-all ${searchMode === 'study' ? 'bg-white shadow-md text-indigo-600' : 'text-slate-500'}`}
          >
            🎓 学習・資格
          </button>
        </div>

        {/* ③ メインの相談パネル（白い枠） */}
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
                onClick={() => askAI()}
                disabled={loading || !input}
                className="bg-[#d97706] hover:bg-[#b45309] text-white font-bold py-3 px-8 rounded-xl transition-all disabled:opacity-50"
              >
                {loading ? "探しています..." : "定番・話題の5冊を探す"}
              </button>
            </div>
          </div>
        </section>

        {/* ④ 現在地検索ボタン（白い枠の「外側・下」に配置！） */}
        <div className="flex flex-wrap gap-4 justify-center mt-2">
          <button
            onClick={() => window.open(`https://www.google.com/maps/search/カフェ/`, '_blank')}
            className="flex-1 min-w-[200px] max-w-[300px] bg-white border-2 border-slate-200 hover:border-orange-300 p-4 rounded-xl transition-all flex items-center justify-center gap-2 text-slate-600 font-bold shadow-sm"
          >
            ☕ 近くのカフェを探す
          </button>
          <button
            onClick={() => window.open(`https://www.google.com/maps/search/図書館/`, '_blank')}
            className="flex-1 min-w-[200px] max-w-[300px] bg-white border-2 border-slate-200 hover:border-blue-300 p-4 rounded-xl transition-all flex items-center justify-center gap-2 text-slate-600 font-bold shadow-sm"
          >
            📖 近くの図書館
          </button>
        </div>

        {/* ⑤ AIからの提案結果を表示するエリア */}
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