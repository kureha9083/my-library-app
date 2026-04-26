'use client';
import { useState } from 'react';

export default function Home() {
  const [input, setInput] = useState('');
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const askAI = async () => {
    setLoading(true);
    setProposals([]);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: input }),
      });

      const data = await res.json();
      const parsed = JSON.parse(data.text); // 強制的にJSONとして読み込む
      setProposals(parsed);
    } catch (err) {
      setProposals([{ 
        title: "データの取得に失敗しました", 
        author: "システム", 
        reason: "もう一度「検索ボタン」を押してみてください。改善されない場合は、少し時間を置いてお試しください。" 
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 p-8 flex flex-col items-center font-sans text-slate-800">
      <div className="w-full max-w-4xl space-y-8">
        <header className="text-center">
          <h1 className="text-4xl font-black mb-2">MOMIJI AI Library</h1>
          <p className="text-slate-500 font-bold">あなたに最適な一冊をAIが厳選します</p>
        </header>

        <section className="bg-white rounded-3xl shadow-xl p-8 border-b-8 border-slate-200">
          <textarea 
            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-lg focus:outline-none focus:border-amber-500 h-32 mb-4"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="例：英検準一級の対策本、泣ける小説など"
          />
          <button 
            onClick={askAI}
            disabled={loading || !input}
            className="w-full bg-slate-900 text-white font-black py-4 rounded-xl hover:bg-black transition-all disabled:opacity-30"
          >
            {loading ? "検索中..." : "提案を受ける"}
          </button>
        </section>

        <div className="space-y-4">
          {proposals.map((book, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 transition-all hover:shadow-md">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-black">{book.title}</h3>
                  <p className="text-slate-500 font-bold">著者: {book.author}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => window.open(`https://www.amazon.co.jp/s?k=${book.title}`, '_blank')} className="px-3 py-1 bg-amber-500 text-white text-xs font-bold rounded-lg">Amazon</button>
                </div>
              </div>
              <button 
                onClick={() => setExpandedId(expandedId === i ? null : i)}
                className="mt-4 text-amber-600 font-black text-sm flex items-center gap-1"
              >
                {expandedId === i ? "▲ 閉じる" : "▼ AIの推薦理由（詳細）を見る"}
              </button>
              {expandedId === i && (
                <div className="mt-3 p-4 bg-slate-50 rounded-xl border-l-4 border-amber-500 text-slate-600 text-sm leading-relaxed font-medium">
                  {book.reason}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}