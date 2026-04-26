"use client";
import { useState } from "react";

export default function Home() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const askAI = async () => {
    if (!input) return;
    setLoading(true);
    setResult("");
    
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({ prompt: input }),
      });
      const data = await res.json();
      setResult(data.text || data.error);
    } catch (e) {
      setResult("通信エラーが発生しました。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f4f1ea] p-8 flex flex-col items-center font-serif">
      <div className="max-w-2xl w-full bg-white shadow-xl rounded-t-3xl rounded-b-md p-8 border-t-8 border-amber-900">
        <h1 className="text-4xl font-bold text-amber-900 mb-3 text-center tracking-wider">AI 図書館</h1>
        <p className="text-amber-700 mb-8 text-center">静かな空間で、いまのあなたに寄り添う一冊を見つけます。</p>
        
        <div className="flex gap-3 mb-8">
          <input 
            className="flex-1 border-2 border-amber-100 rounded-lg p-4 text-amber-900 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 bg-[#fffdfa] placeholder-amber-300" 
            value={input} 
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && askAI()}
            placeholder="例：最近、新しいことに挑戦したくて..."
          />
          <button 
            onClick={askAI} 
            disabled={loading}
            className="bg-amber-800 hover:bg-amber-900 text-white font-bold py-4 px-8 rounded-lg transition-all disabled:bg-amber-300 shadow-md"
          >
            {loading ? "本を探し中..." : "相談する"}
          </button>
        </div>

        {result && (
          <div className="p-8 bg-[#fcfaf5] rounded-xl border border-amber-100 text-amber-900 leading-loose whitespace-pre-wrap shadow-inner">
            {result}
          </div>
        )}
      </div>
    </main>
  );
}