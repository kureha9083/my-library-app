import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "APIキー不足" }, { status: 500 });

    const genAI = new GoogleGenerativeAI(apiKey);
    const { query, mode } = await req.json();
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const systemPrompt = `
      あなたは図書コンシェルジュです。
      ユーザーの要望に合う本を5冊、以下のJSON形式のみで出力してください。
      【重要】 \`\`\`json などのマークダウン記号は絶対に書かないでください。純粋な [ ] で囲まれたデータだけを出力してください。

      [
        {
          "id": "1",
          "title": "本のタイトル",
          "author": "著者名",
          "details": "内容の簡潔な要約",
          "youtube": "[https://www.youtube.com/results?search_query=本のタイトル+書評](https://www.youtube.com/results?search_query=本のタイトル+書評)",
          "amazon": "[https://www.amazon.co.jp/s?k=本のタイトル](https://www.amazon.co.jp/s?k=本のタイトル)"
        }
      ]
    `;

    const result = await model.generateContent([systemPrompt, query]);
    const response = await result.response;
    return NextResponse.json({ result: response.text() });
    
  } catch (error) {
    return NextResponse.json({ error: "通信失敗" }, { status: 500 });
  }
}