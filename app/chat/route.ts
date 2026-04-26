import { GoogleGenerativeAI } from "@google/generative-ai";

// APIキーの取得
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { prompt, mode } = await req.json();

    // 🌟 AIへの「絶対のルール」を定義
    const systemPrompt = `
あなたはプロの司書です。ユーザーの入力に対して、必ず条件に合う本や参考書を「厳選して5冊」提案してください。
【絶対条件】出力は必ず以下のJSON配列の形式のみで行うこと。前後の挨拶、試験の解説、Markdown記号などは一切含めないでください。

[
  {
    "title": "本のタイトル（正確に）",
    "author": "著者名（または出版社）",
    "reason": "なぜこの本をおすすめするのか、3〜4行程度の簡潔で読みやすい理由"
  }
]

ユーザーの入力: ${prompt}
検索モード: ${mode === 'study' ? '学習・資格・専門書' : '一般文芸・話題作'}
`;

    // ⚠️ ご指定の gemini-2.5 に修正
    const model = genAI.getGenerativeModel({ model: "gemini-2.5" });
    const result = await model.generateContent(systemPrompt);
    const text = result.response.text();

    return Response.json({ text });

  } catch (error) {
    console.error("AI通信エラー:", error);
    return Response.json({ error: "通信に失敗しました" }, { status: 500 });
  }
}