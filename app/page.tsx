"use client";
import Script from 'next/script';
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Star, 
  ChevronDown, 
  ChevronUp, 
  Trash2, 
  Send, 
  BookOpen, 
  ShoppingCart, 
  Play, 
  MapPin, 
  X, 
  Sparkles, 
  Coffee, 
  Search, 
  ExternalLink, 
  Info, 
  Library, 
  Layout, 
  Compass, 
  Globe 
} from 'lucide-react';

// --- 型定義 (絶対死守) ---
type Book = {
  id: string;
  title: string;
  author: string;
  details: string;
  youtube: string;
  amazon: string;
};

type Message = {
  role: 'user' | 'ai';
  text?: string;
  books?: Book[];
};

export default function MomijiLibrary() {
  // --- ステート管理 (全機能死守・一文字も削らず維持) ---
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'ai', 
      text: 'MOMIJI AI LIBRARYへようこそ。知識の広大な海から、あなたに最適な一冊をコンシェルジュが厳密に選定させていただきます。' 
    }
  ]);
  const [savedBooks, setSavedBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'exam' | 'specialized'>('exam');
  const [expandedIds, setExpandedIds] = useState<{ [key: string]: boolean }>({});
  
  const [showMap, setShowMap] = useState(false);
  const [mapCategory, setMapCategory] = useState<'library' | 'cafe' | 'bookstore'>('library');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  
  const [loadingMsg, setLoadingMsg] = useState("");
  
  // ユーモア溢れるメッセージ群 (絶対死守)
  const humorousMsgs = [
    "脳内図書館を全力疾走して探しています...🏃‍♂️💨",
    "最高の5冊を厳選中... しばしお待ちを！✨", // ★15から5に変更しました
    "コンシェルジュが本棚の奥底まで大捜索しています🔍",
    "知恵を絞り出しています...🧠💡",
    "ページをめくる音が聞こえてきませんか？調査中です！📚",
    "一生懸命、あなたにぴったりの本を選んでいます...！🔥",
    "インクの香りを辿って最適なページを開いています...📖✨",
    "データセンターの最深部にある書庫を整理中です。もうすぐです！⚡",
    "稀覯本（きこうぼん）の山からあなたへの回答を抽出しています...🏺",
    "世界の知のネットワークにアクセスし、最適なタイトルを照合中...🌐"
  ];

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- 位置情報取得ロジック (死守) ---
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        },
        (error) => console.error("位置情報取得失敗", error),
        { enableHighAccuracy: true, timeout: 15000 }
      );
    }
  }, 
  []);

  // --- オートスクロール (死守) ---
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, expandedIds, loading]);

  // --- 404エラー回避用・精密URL生成 (死守) ---
  const createSearchUrl = (type: 'amazon' | 'youtube', title: string) => {
    const cleanTitle = encodeURIComponent(title.trim());
    if (type === 'amazon') {
      return `https://www.amazon.co.jp/s?k=${cleanTitle}&i=stripbooks&tag=momiji9083-22&ref=nb_sb_noss`;
    }
    return `https://www.youtube.com/results?search_query=${cleanTitle}+解説+参考書`;
  };

  // --- 検索処理 (全ロジック死守 + 5件リクエストへの対応) ---
  async function handleSearch(overrideQuery?: string) {
    const targetQuery = typeof overrideQuery === 'string' ? overrideQuery : query;
    if (!targetQuery.trim()) return;

    setQuery("");
    setMessages(prev => [...prev, { role: 'user', text: targetQuery }]);
    setLoadingMsg(humorousMsgs[Math.floor(Math.random() * humorousMsgs.length)]);
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: targetQuery,
          mode: activeTab,
          count: 5 // ★8個から5個に変更しました（速度改善のため）
        }),
      });

      if (!res.ok) throw new Error();
      const data = await res.json();

      // JSONクリーニング
      let cleanText = data.result.replace(/```json/gi, '').replace(/```/g, '').trim();

      try {
        const parsedBooks: Book[] = JSON.parse(cleanText);
        setMessages(prev => [...prev, { role: 'ai', books: parsedBooks }]);
      } catch (e) {
        setMessages(prev => [...prev, { role: 'ai', text: "データの整理中に不整合が発生しました。もう一度お試しください。" }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', text: "通信経路に負荷がかかっています。ネットワークをご確認ください。" }]);
    } finally {
      setLoading(false);
    }
  }

  const toggleSave = (book: Book) => {
    if (savedBooks.find(b => b.title === book.title)) {
      setSavedBooks(savedBooks.filter(b => b.title !== book.title));
    } else {
      setSavedBooks([...savedBooks, book]);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // --- カテゴリ (絶対に削らない) ---
  const examCategories = ['英語', '数学', '現代文・古文・漢文', '物理・化学', '日本史・世界史', '共通テスト対策', '小論文', '鉄緑会系'];
  const specializedCategories = ['IT・プログラミング', '資格取得', 'ビジネス', '医療・看護', '理工学', '人文・教育', 'デザイン', '法学・政治'];
  const currentCategories = activeTab === 'exam' ? examCategories : specializedCategories;

  // --- マップURL修正版 (普通のカフェ検索へ変更・現在地連動を死守) ---
  const getMapSrc = () => {
    const categoryTerms = { 
      library: '近くの図書館', 
      cafe: '近くのカフェ', 
      bookstore: '近くの本屋' ,
    };
    const q = encodeURIComponent(categoryTerms[mapCategory]);
    if (location) {
      return `https://maps.google.com/maps?q=${q}&ll=${location.lat},${location.lng}&z=15&output=embed&hl=ja`;
    }
    return `https://maps.google.com/maps?q=${q}&z=14&output=embed&hl=ja`;
  };

  return (
    <main className="min-h-screen bg-[#fcfdfe] flex flex-col font-sans relative text-slate-900 overflow-x-hidden">
      
     {/* プレミアム・ヘッダー (死守) */}
      <header className="bg-white py-5 px-8 shadow-sm fixed top-0 w-full z-50 flex items-center justify-between border-b border-indigo-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100">
            <BookOpen size={22} className="text-white" />
          </div>
          <h1 className="text-xl md:text-2xl font-[1000] tracking-tighter text-indigo-900">MOMIJI AI LIBRARY</h1>

         {/* --- A8広告エリア：タイトルの横に配置 --- */}
<div className="hidden lg:flex items-center ml-4 h-10 overflow-hidden">
  <div className="scale-[0.4] origin-left">
    <a href="https://px.a8.net/svt/ejp?a8mat=4B1VU0+8RJREA+4EKC+63OY9" rel="nofollow">
      <img src="https://www27.a8.net/svt/bgt?aid=260428392530&wid=001&eno=01&mid=s00000020550001025000&mc=1" width="300" height="250" alt="" style={{ border: 0 }} />
    </a>
    <img src="https://www16.a8.net/0.gif?a8mat=4B1VU0+8RJREA+4EKC+63OY9" width="1" height="1" alt="" style={{ border: 0 }} />
  </div>
</div>
{/* --- ここまで --- */}

        </div>
        <button 
          onClick={() => setShowMap(!showMap)}
          className="bg-slate-900 text-white px-6 py-2.5 rounded-xl hover:bg-indigo-600 transition-all text-xs font-black shadow-lg active:scale-95 flex items-center gap-2"
        >
          {showMap ? <><X size={16}/> CLOSE</> : <><MapPin size={16}/> SPOTS</>}
        </button>
      </header>

      {/* マップ (死守) */}
      <AnimatePresence>
        {showMap && (
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }} className="fixed inset-0 z-40 bg-white pt-20 flex flex-col">
            <div className="bg-slate-50 p-4 border-b flex justify-center gap-4 overflow-x-auto no-scrollbar">
              {[
                { id: 'library', name: 'LIBRARY', icon: <Library size={16}/> },
                { id: 'cafe', name: 'CAFE', icon: <Coffee size={16}/> },
                { id: 'bookstore', name: 'BOOK STORE', icon: <Search size={16}/> }
              ].map((cat) => (
                <button key={cat.id} onClick={() => setMapCategory(cat.id as any)} className={`flex items-center gap-2 px-8 py-3.5 rounded-xl text-xs font-[1000] transition-all ${mapCategory === cat.id ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-400'}`}>
                  {cat.icon} {cat.name}
                </button>
              ))}
            </div>
            <div className="flex-1 w-full bg-slate-100 relative">
              <iframe width="100%" height="100%" style={{ border: 0 }} src={getMapSrc()} allowFullScreen loading="lazy"></iframe>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* チャットメインエリア (pb-52、曇りなし) */}
      {!showMap && (
        <div className="flex-1 max-w-6xl w-full mx-auto p-5 pt-28 pb-52 space-y-12 relative z-10">
          
          {/* お気に入りキュレーション (死守) */}
          <AnimatePresence>
            {savedBooks.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-3xl p-8 shadow-sm border border-indigo-50">
                <h2 className="text-xl font-[1000] mb-6 flex items-center gap-3 text-slate-800"><Star className="text-yellow-400 fill-yellow-400" size={24}/> COLLECTION</h2>
                <div className="flex flex-wrap gap-3">
                  {savedBooks.map((book, i) => (
                    <div key={i} className="bg-slate-50 px-4 py-2 rounded-xl border border-indigo-50 flex items-center gap-3">
                      <span className="font-bold text-slate-700 text-xs">{book.title}</span>
                      <button onClick={() => toggleSave(book)} className="text-slate-300 hover:text-red-500"><Trash2 size={16}/></button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* メッセージ・ログ (死守) */}
          <div className="space-y-10">
            {messages.map((msg, index) => (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'user' ? (
                  <div className="max-w-[80%] rounded-2xl rounded-tr-none px-6 py-4 bg-indigo-600 text-white shadow-md font-bold text-base">{msg.text}</div>
                ) : (
                  <div className="w-full space-y-8">
                    {msg.text && <div className="max-w-[90%] rounded-2xl rounded-tl-none px-8 py-6 bg-white border border-slate-200 text-slate-800 shadow-sm font-[900] text-lg leading-relaxed">{msg.text}</div>}
                    
                    {/* 8個の結果を表示する2カラムグリッド (死守) */}
                    {msg.books && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                        {msg.books.map((book) => {
                          const uniqueId = `${index}-${book.id}`;
                          const isExpanded = expandedIds[uniqueId];
                          const isSaved = savedBooks.find(b => b.title === book.title);
                          return (
                            <div key={uniqueId} className="bg-white rounded-[2rem] border border-slate-100 shadow-lg overflow-hidden flex flex-col h-fit">
                              <div className="p-6 flex justify-between items-start gap-4">
                                <div className="space-y-2 flex-1 min-w-0">
                                  <div className="flex items-center gap-2 text-indigo-600 font-[1000] text-[9px] tracking-[0.2em] uppercase">
                                    <Sparkles size={12}/> PREMIUM SELECT
                                  </div>
                                  <h3 className="font-[1000] text-lg md:text-xl text-slate-900 tracking-tight leading-tight truncate">{book.title}</h3>
                                  <p className="text-slate-500 font-black text-sm italic truncate">{book.author}</p>
                                </div>
                                <button onClick={() => toggleSave(book)} className={`shrink-0 p-3.5 rounded-xl border transition-all ${isSaved ? "bg-yellow-50 border-yellow-200" : "bg-slate-50"}`}>
                                  <Star size={20} className={isSaved ? "text-yellow-400 fill-yellow-400" : "text-slate-200"} />
                                </button>
                              </div>
                              
                              <div className="px-6 py-4 bg-slate-50/50 border-t flex flex-wrap gap-2 items-center mt-auto">
                                <a href={createSearchUrl('amazon', book.title)} target="_blank" rel="noreferrer" className="bg-slate-900 text-white px-4 py-2.5 rounded-lg text-xs font-[1000] hover:bg-indigo-600 transition-all flex items-center gap-2">
                                  <ShoppingCart size={14}/> AMAZON
                                </a>
                                <a href={createSearchUrl('youtube', book.title)} target="_blank" rel="noreferrer" className="bg-white border border-red-100 text-red-600 px-4 py-2.5 rounded-lg text-xs font-[1000] hover:bg-red-50 flex items-center gap-2">
                                  <Play size={14} fill="currentColor"/> VIDEO
                                </a>
                                <button onClick={() => toggleExpand(uniqueId)} className="ml-auto text-slate-400 hover:text-indigo-600 font-black text-[10px] flex items-center gap-1">
                                  {isExpanded ? <><ChevronUp size={16}/> CLOSE</> : <><ChevronDown size={16}/> DETAILS</>}
                                </button>
                              </div>

                              <AnimatePresence>
                                {isExpanded && (
                                  <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden border-t bg-white">
                                    <div className="p-6">
                                      <div className="bg-indigo-50/30 p-5 rounded-xl border border-indigo-50">
                                        <p className="font-[1000] text-indigo-900 mb-2 text-sm underline decoration-indigo-200 decoration-4 underline-offset-[-1px]">コンシェルジュ解説</p>
                                        <p className="font-bold text-xs leading-relaxed text-slate-700">{book.details}</p>
                                      </div>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
            
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl px-10 py-6 bg-white border border-indigo-100 text-indigo-600 shadow-lg flex items-center gap-5">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 bg-indigo-600 rounded-full animate-bounce"></div>
                    <div className="w-3 h-3 bg-indigo-600 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-3 h-3 bg-indigo-600 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                  <span className="font-black text-base italic">{loadingMsg}</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} className="h-4" />
           
          </div>
        </div>
      )}
      {/* --- 操作エリア (死守・曇りなし・スリム) --- */}
      {!showMap && (
        <div className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-100 pb-6 pt-4 px-6 z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.02)]">
          <div className="max-w-3xl mx-auto flex flex-col gap-4">
            
            {/* クイックカテゴリ (死守) */}
            <div className="flex flex-wrap gap-2 justify-center">
              {currentCategories.map((cat) => (
                <button key={cat} onClick={() => handleSearch(activeTab === 'exam' ? `大学受験 ${cat} 参考書` : `${cat} 専門書`)}
                  className="bg-slate-50 border border-slate-100 text-slate-400 px-3 py-1.5 rounded-lg text-[10px] font-black hover:border-indigo-400 hover:text-indigo-600 transition-all active:scale-95"
                >#{cat}</button>
              ))}
            </div>

            {/* スリム化された入力欄 (死守) */}
            <div className="flex gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-200 items-center">
              <input 
                className="flex-1 px-4 py-2.5 outline-none bg-transparent text-slate-800 placeholder-slate-300 font-bold text-base"
                placeholder={activeTab === 'exam' ? "志望校や科目を入力..." : "学びたい分野を入力..."}
                value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                disabled={loading}
              />
              <button 
                onClick={() => handleSearch()}
                className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 shadow-md active:scale-90 disabled:opacity-30"
                disabled={loading || !query.trim()}
              >
                <Send size={20} />
              </button>
            </div>

            {/* モードセレクター (死守) */}
            <div className="flex bg-slate-900 rounded-xl p-1 shadow-md max-w-xs mx-auto w-full">
              <button onClick={() => setActiveTab('exam')} className={`flex-1 py-2 rounded-lg text-[10px] font-black tracking-widest transition-all ${activeTab === 'exam' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>UNIVERSITY</button>
              <button onClick={() => setActiveTab('specialized')} className={`flex-1 py-2 rounded-lg text-[10px] font-black tracking-widest transition-all ${activeTab === 'specialized' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>SPECIALIST</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}