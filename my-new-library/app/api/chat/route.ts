import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { prompt } = body;

    if (!prompt) {
      return NextResponse.json({ error: "プロンプトが空です" }, { status: 400 });
    }

    // 環境変数（APIキー）の読み込み
    const apiKey = process.env.GEMINI_API_KEY; 
    if (!apiKey) {
      console.error("❌ APIキーが設定されていません。 .env.local を確認してください。");
      return NextResponse.json({ error: "APIキーがサーバーに設定されていません" }, { status: 500 });
    }

    // Gemini APIの初期化
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // パッケージ更新後に使える最新・最速モデルを指定
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    console.log("🤖 AIにリクエストを送信中...");
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    console.log("✅ AIから応答がありました");

    return NextResponse.json({ text });

  } catch (error: any) {
    console.error("❌ [API Route Error] 詳細:", error.message || error);
    return NextResponse.json(
      { error: "AIの処理中にエラーが発生しました", details: error.message },
      { status: 500 }
    );
  }
}